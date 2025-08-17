import Appointment from '../models/appointmentModel.js';
import NotificationService from './notificationService.js';
import { GoogleCalendarService } from './googleCalendarService.js';

export class AppointmentService {
  constructor() {
    this.notificationService = new NotificationService();
    // Only initialize Google Calendar if credentials are available
    if (
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI &&
      process.env.GOOGLE_REFRESH_TOKEN
    ) {
      this.googleCalendarService = new GoogleCalendarService();
    } else {
      console.warn('Google Calendar credentials not found. Google Calendar features will be disabled.');
    }
  }

  async createAppointment(appointmentData) {
    try {
      // Check for scheduling conflicts
      await this.#checkSchedulingConflicts(appointmentData);

      const appointment = new Appointment(appointmentData);

      // Handle Google Meet appointments only if Google Calendar is available
      if (appointmentData.type === 'Google Meet' && this.googleCalendarService) {
        // Get client info for Google Meet
        let clientName = appointment.clientName || 'Client';
        let clientEmail = null;
        
        if (appointment.clientId) {
          // If we have clientId, populate the client info
          await appointment.populate('clientId');
          clientName = appointment.clientId.username || appointment.clientId.email;
          clientEmail = appointment.clientId.email;
        }
        
        const calendarEvent = await this.googleCalendarService.createMeeting({
          summary: `Meeting with ${clientName}`,
          startTime: appointment.scheduledAt,
          duration: appointment.duration,
          attendees: clientEmail ? [clientEmail] : []
        });
        
        appointment.meetingLink = calendarEvent.hangoutLink;
        appointment.calendarEventId = calendarEvent.id;
      }

      await appointment.save();
      
      // Only send notification if we have client contact info
      if (appointment.clientId) {
        await this.notificationService.sendAppointmentConfirmation(appointment);
      }

      return appointment;
    } catch (error) {
      throw new Error(`Error creating appointment: ${error.message}`);
    }
  }

  async getUserAppointments(userId, userRole, page = 1, limit = 10, filters = {}) {
    try {
      let query = {};
      
      // Build query based on user role
      if (userRole === 'CLIENT') {
        query.clientId = userId;
      } else if (userRole === 'RECEPTIONIST') {
        query.receptionistId = userId;
      } else if (userRole === 'CLOSER') {
        query.closerId = userId;
      } else if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
        // Admin can see all appointments - no specific filter
      } else {
        // Default: show appointments where user is the client
        query.clientId = userId;
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.type) {
        query.type = filters.type;
      }

      // Filter for upcoming appointments
      if (filters.upcoming) {
        query.scheduledAt = { $gte: new Date() };
      }

      const skip = (page - 1) * limit;
      const appointments = await Appointment.find(query)
        .sort({ scheduledAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('receptionistId', 'username')
        .populate('clientId', 'username email')
        .populate('closerId', 'username');

      const total = await Appointment.countDocuments(query);

      return {
        appointments,
        pagination: {
          current: page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching client appointments: ${error.message}`);
    }
  }

  async getStudioSchedule(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await Appointment.find({
        type: 'Studio Shooting',
        scheduledAt: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: { $ne: 'cancelled' }
      }).populate('clientId', 'username email')
        .populate('receptionistId', 'username');

      return this.#generateTimeSlots(appointments, startOfDay);
    } catch (error) {
      throw new Error(`Error fetching studio schedule: ${error.message}`);
    }
  }

  async updateAppointmentStatus(appointmentId, status, notes) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('clientId', 'email')
        .populate('receptionistId', 'username');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const oldStatus = appointment.status;
      appointment.status = status;
      
      if (notes) {
        appointment.notes = notes;
      }

      if (status === 'cancelled') {
        if (appointment.type === 'Google Meet' && appointment.calendarEventId) {
          await this.googleCalendarService.cancelMeeting(appointment.calendarEventId);
        }
        await this.notificationService.sendAppointmentCancellation(appointment);
      } else if (status === 'completed') {
        appointment.completedAt = new Date();
        await this.notificationService.sendAppointmentCompletion(appointment);
      }

      await appointment.save();
      return appointment;
    } catch (error) {
      throw new Error(`Error updating appointment status: ${error.message}`);
    }
  }

  async rescheduleAppointment(appointmentId, newScheduledAt) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('clientId', 'email username')
        .populate('receptionistId', 'username');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check for conflicts with new time
      await this.#checkSchedulingConflicts({
        ...appointment.toObject(),
        scheduledAt: newScheduledAt
      });

      const oldScheduledAt = appointment.scheduledAt;
      appointment.scheduledAt = newScheduledAt;
      appointment.rescheduledAt = new Date();

      // Update Google Calendar event if exists
      if (appointment.type === 'Google Meet' && appointment.calendarEventId) {
        await this.googleCalendarService.updateMeeting({
          eventId: appointment.calendarEventId,
          startTime: newScheduledAt,
          duration: appointment.duration,
          attendees: [appointment.clientId.email]
        });
      }

      await appointment.save();
      await this.notificationService.sendReschedulingNotification(appointment, oldScheduledAt);
      
      return appointment;
    } catch (error) {
      throw new Error(`Error rescheduling appointment: ${error.message}`);
    }
  }

  // Private helper methods
  async #checkSchedulingConflicts(appointmentData) {
    const { scheduledAt, duration, type } = appointmentData;
    
    const appointmentEnd = new Date(scheduledAt);
    appointmentEnd.setMinutes(appointmentEnd.getMinutes() + duration);

    const conflictingAppointments = await Appointment.find({
      type,
      status: { $ne: 'cancelled' },
      $and: [
        { scheduledAt: { $lt: appointmentEnd } },
        {
          $expr: {
            $gt: [
              { $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] },
              scheduledAt
            ]
          }
        }
      ]
    });

    if (conflictingAppointments.length > 0) {
      throw new Error('Time slot is already booked');
    }
  }

  #generateTimeSlots(appointments, date) {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const slotDuration = 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotTime);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

        const bookedAppointment = appointments.find(apt => {
          const aptEnd = new Date(apt.scheduledAt);
          aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);
          return apt.scheduledAt < slotEnd && aptEnd > slotTime;
        });

        slots.push({
          startTime: slotTime,
          endTime: slotEnd,
          available: !bookedAppointment,
          appointment: bookedAppointment ? {
            id: bookedAppointment._id,
            clientName: bookedAppointment.clientId.username,
            duration: bookedAppointment.duration,
            type: bookedAppointment.type,
            status: bookedAppointment.status
          } : null
        });
      }
    }

    return slots;
  }

  #isBusinessHour(date) {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const dayOfWeek = date.getDay();

    // Check if it's a weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Convert time to minutes for easier comparison
    const timeInMinutes = hour * 60 + minute;
    const startTimeInMinutes = 9 * 60; // 9 AM
    const endTimeInMinutes = 17 * 60; // 5 PM

    return timeInMinutes >= startTimeInMinutes && timeInMinutes <= endTimeInMinutes;
  }
}