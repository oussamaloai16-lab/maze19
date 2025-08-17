// routes/appointmentRoutes.js
import express from 'express';
import { AppointmentController } from '../controllers/appointmentController.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
const appointmentController = new AppointmentController();

router.use(protect);

// Client & receptionist routes
router.post('/', 
  checkPermission('appointments', 'create'),
  appointmentController.createAppointment
);

router.get('/my-appointments', 
  checkPermission('appointments', 'read'),
  appointmentController.getClientAppointments
);

// Receptionist specific routes
router.get('/studio-schedule', 
  checkPermission('appointments', 'read'),
  appointmentController.getStudioSchedule
);

router.patch('/:appointmentId/status', 
  checkPermission('appointments', 'update'),
  appointmentController.updateAppointmentStatus
);

// Add new endpoint for rescheduling appointments
router.patch('/:appointmentId/reschedule',
  checkPermission('appointments', 'update'),
  appointmentController.rescheduleAppointment
);

export default router;