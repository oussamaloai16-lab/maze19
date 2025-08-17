// controllers/verificationController.js
import { VerificationService } from '../services/verificationService.js';

export class VerificationController {
  constructor() {
    this.verificationService = new VerificationService();
  }

  // Endpoint to verify email with token
  verifyEmail = async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({
          status: 'fail',
          message: 'Verification token is required'
        });
      }
      
      const result = await this.verificationService.verifyEmail(token);
      
      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      console.error('Email verification error:', error);
      
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };

  // Endpoint to resend verification email
  resendVerificationEmail = async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          status: 'fail',
          message: 'Email is required'
        });
      }
      
      const result = await this.verificationService.resendVerificationEmail(email);
      
      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      console.error('Resend verification email error:', error);
      
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };
}

export default VerificationController;