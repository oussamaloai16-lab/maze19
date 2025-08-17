// controllers/mfaController.js
import { MFAService } from '../services/mfaService.js';

export class MFAController {
  constructor() {
    this.mfaService = new MFAService();
  }

  // Generate MFA setup for user
  generateMFA = async (req, res) => {
    try {
      const userId = req.user._id;
      
      const result = await this.mfaService.generateMFASecret(userId);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Generate MFA error:', error);
      
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };

  // Verify and enable MFA
  enableMFA = async (req, res) => {
    try {
      const userId = req.user._id;
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          status: 'fail',
          message: 'Verification code is required'
        });
      }
      
      const result = await this.mfaService.verifyAndEnableMFA(userId, token);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Enable MFA error:', error);
      
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };

  // Verify MFA token during login
  verifyMFA = async (req, res) => {
    try {
      const { userId, token } = req.body;
      
      if (!userId || !token) {
        return res.status(400).json({
          status: 'fail',
          message: 'User ID and verification code are required'
        });
      }
      
      const result = await this.mfaService.verifyMFAToken(userId, token);
      
      // If we get here, MFA is verified
      // Generate a new session token or update existing token
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Verify MFA error:', error);
      
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };

  // Disable MFA
  disableMFA = async (req, res) => {
    try {
      const userId = req.user._id;
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          status: 'fail',
          message: 'Verification code is required'
        });
      }
      
      const result = await this.mfaService.disableMFA(userId, token);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Disable MFA error:', error);
      
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
  };

  // Check if MFA is required and/or enabled
  checkMFAStatus = async (req, res) => {
    try {
      const userId = req.user._id;
      
      const result = await this.mfaService.isMFARequired(userId);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Check MFA status error:', error);
      
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  };
}

export default MFAController;