// routes/mfaRoutes.js
import express from 'express';
import { MFAController } from '../controllers/mfaController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
const mfaController = new MFAController();

// All MFA routes require authentication
router.use(protect);

// Generate MFA setup (QR code and secret)
router.post('/generate', mfaController.generateMFA);

// Verify and enable MFA
router.post('/enable', mfaController.enableMFA);

// Verify MFA token (for login)
router.post('/verify', mfaController.verifyMFA);

// Disable MFA
router.post('/disable', mfaController.disableMFA);

// Check MFA status
router.get('/status', mfaController.checkMFAStatus);

export default router;