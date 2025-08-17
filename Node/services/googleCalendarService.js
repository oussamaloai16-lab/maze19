// services/googleCalendarService.js
import { google } from 'googleapis';

export class GoogleCalendarService {
  constructor() {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      this.calendar = google.calendar({
        version: 'v3',
        auth: this.oauth2Client
      });
    } catch (error) {
      console.error('Error initializing Google Calendar Service:', error);
      throw new Error('Failed to initialize Google Calendar Service');
    }
  }

  async createMeeting({ summary, startTime, duration, attendees, description = '' }) {
    try {
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const event = {
        summary,
        description,
        start: {
          dateTime: startTime,
          timeZone: 'Africa/Algiers',
        },
        end: {
          dateTime: endTime,
          timeZone: 'Africa/Algiers',
        },
        attendees: attendees.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `zr-meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 15 }
          ]
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all'
      });

      return {
        id: response.data.id,
        hangoutLink: response.data.hangoutLink,
        htmlLink: response.data.htmlLink,
        status: response.data.status
      };
    } catch (error) {
      console.error('Google Calendar create meeting error:', error);
      throw new Error(`Failed to create Google Meet: ${error.message}`);
    }
  }

  async updateMeeting({ eventId, startTime, duration, attendees, description }) {
    try {
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const event = {
        start: {
          dateTime: startTime,
          timeZone: 'Africa/Algiers',
        },
        end: {
          dateTime: endTime,
          timeZone: 'Africa/Algiers',
        },
        attendees: attendees.map(email => ({ email }))
      };

      if (description) {
        event.description = description;
      }

      const response = await this.calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
        sendUpdates: 'all'
      });

      return {
        id: response.data.id,
        hangoutLink: response.data.hangoutLink,
        htmlLink: response.data.htmlLink,
        status: response.data.status
      };
    } catch (error) {
      console.error('Google Calendar update meeting error:', error);
      throw new Error(`Failed to update Google Meet: ${error.message}`);
    }
  }

  async cancelMeeting(eventId) {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all'
      });

      return true;
    } catch (error) {
      console.error('Google Calendar cancel meeting error:', error);
      throw new Error(`Failed to cancel Google Meet: ${error.message}`);
    }
  }

  async checkAvailability(startTime, endTime) {
    try {
      const response = await this.calendar.freebusy.query({
        resource: {
          timeMin: startTime,
          timeMax: endTime,
          timeZone: 'Africa/Algiers',
          items: [{ id: 'primary' }]
        }
      });

      const busySlots = response.data.calendars.primary.busy;
      return busySlots.length === 0;
    } catch (error) {
      console.error('Google Calendar availability check error:', error);
      throw new Error(`Failed to check availability: ${error.message}`);
    }
  }
}

export default GoogleCalendarService;