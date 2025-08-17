// routes/verificationRoutes.js
import express from 'express';
import { VerificationController } from '../controllers/verificationController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
const verificationController = new VerificationController();

// Public route to verify email with token
router.get('/verify/:token', verificationController.verifyEmail);

// Protected route to resend verification email (requires login)
router.post('/resend', protect, verificationController.resendVerificationEmail);

// Public route to resend verification (doesn't require login)
router.post('/public/resend', verificationController.resendVerificationEmail);

export default router;