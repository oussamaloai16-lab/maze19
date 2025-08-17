// middleware/verificationMiddleware.js
import User from '../models/userModel.js';

// Middleware to check if user's email is verified
export const requireVerifiedEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    if (!user.isVerified) {
      return res.status(403).json({
        status: 'fail',
        message: 'Email verification required',
        requireVerification: true
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

export default requireVerifiedEmail;