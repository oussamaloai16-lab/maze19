// controllers/appointmentController.js
import Appointment from '../models/appointmentModel.js';
import { AppointmentService } from '../services/appointmentService.js';

export class AppointmentController {
  constructor() {
    this.appointmentService = new AppointmentService();
  }

  createAppointment = async (req, res) => {
    try {
      const appointmentData = {
        ...req.body,
        receptionistId: req.user.role === 'RECEPTIONIST' ? req.user._id : null,
        closerId: req.user.role === 'CLOSER' ? req.user._id : null
      };

      // If no clientId is provided but clientName is, use the clientName
      // If it's a client creating their own appointment, use their ID
      if (!appointmentData.clientId && !appointmentData.clientName && req.user.role === 'CLIENT') {
        appointmentData.clientId = req.user._id;
      }

      const appointment = await this.appointmentService.createAppointment(appointmentData);
      res.status(201).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  getClientAppointments = async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const appointments = await this.appointmentService.getUserAppointments(req.user._id, req.user.role, page, limit, { status });
      res.status(200).json({
        success: true,
        data: appointments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  updateAppointmentStatus = async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { status } = req.body;
      const appointment = await this.appointmentService.updateAppointmentStatus(appointmentId, status);
      res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  getStudioSchedule = async (req, res) => {
    try {
      const { date } = req.query;
      const schedule = await this.appointmentService.getStudioSchedule(date);
      res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  rescheduleAppointment = async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { scheduledAt } = req.body;
      
      if (!scheduledAt) {
        return res.status(400).json({
          success: false,
          message: 'New schedule date and time is required'
        });
      }

      const appointment = await this.appointmentService.rescheduleAppointment(appointmentId, new Date(scheduledAt));
      
      res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}