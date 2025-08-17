// Enhanced creditController.js with better error handling and validation

import User from '../models/userModel.js';
import SuggestedClient from '../models/suggestedClientModel.js';

export class CreditController {
  // Get user's credit status
  getCreditStatus = async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Only closers have credits
      if (user.role !== 'CLOSER') {
        return res.status(200).json({
          success: true,
          data: {
            current: null,
            total: null,
            used: null,
            percentage: null,
            lastRecharge: null,
            message: 'Credit system not applicable for this role'
          }
        });
      }
      
      // Initialize credits if they don't exist
      if (!user.credits || user.credits.current === undefined) {
        user.credits = {
          current: 0,
          total: 0,
          used: 0,
          lastRecharge: null,
          history: []
        };
        await user.save();
      }
      
      res.status(200).json({
        success: true,
        data: {
          current: user.credits.current,
          total: user.credits.total,
          used: user.credits.used,
          percentage: user.credits.total > 0 ? (user.credits.current / user.credits.total) * 100 : 0,
          lastRecharge: user.credits.lastRecharge
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Enhanced phone number reveal with better validation
  revealPhoneNumber = async (req, res) => {
    try {
      const { clientId } = req.params;
      const userId = req.user._id;
      
      // Get user and validate role
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (user.role !== 'CLOSER') {
        return res.status(403).json({
          success: false,
          message: 'Only closers can use the credit system to reveal phone numbers'
        });
      }
      
      // Initialize credits if they don't exist
      if (!user.credits || user.credits.current === undefined) {
        user.credits = {
          current: 0,
          total: 0,
          used: 0,
          lastRecharge: null,
          history: []
        };
        await user.save();
      }
      
      // Get the client first to determine credit cost
      const client = await SuggestedClient.findById(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }
      
      // Check if phone number exists
      if (!client.phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'No phone number available for this client'
        });
      }
      
      // Calculate credit cost based on client score
      const clientScore = client.score || 0;
      let creditCost = 1; // Default cost
      let scoreCategory = 'Low';
      
      if (clientScore < 100) {
        creditCost = 1;
        scoreCategory = 'Low';
      } else if (clientScore >= 100 && clientScore <= 400) {
        creditCost = 2;
        scoreCategory = 'Medium';
      } else if (clientScore > 400) {
        creditCost = 3;
        scoreCategory = 'High';
      }
      
      // Check if user has sufficient credits
      if (user.credits.current < creditCost) {
        return res.status(400).json({
          success: false,
          message: `Insufficient credits. You need ${creditCost} credits to reveal this phone number (${scoreCategory} score: ${clientScore}). You have ${user.credits.current} credits. Please contact your administrator to recharge.`,
          data: {
            requiredCredits: creditCost,
            currentCredits: user.credits.current,
            clientScore: clientScore,
            scoreCategory: scoreCategory
          }
        });
      }
      
      // Deduct credits using atomic operation (variable cost based on score)
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $inc: { 
            'credits.current': -creditCost,
            'credits.used': creditCost
          },
          $push: {
            'credits.history': {
              type: 'deduction',
              amount: creditCost,
              reason: `Phone number revealed for ${scoreCategory} score client: ${client.storeName} (${client.suggestedClientId}, Score: ${clientScore})`,
              date: new Date(),
              relatedClientId: clientId,
              scoreCategory: scoreCategory,
              clientScore: clientScore
            }
          }
        },
        { new: true }
      );
      
      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: 'Failed to deduct credit'
        });
      }
      
      // Log the phone number access for audit purposes
      console.log(`Phone number revealed by ${user.username} for ${scoreCategory} score client ${client.suggestedClientId} (${creditCost} credits) at ${new Date()}`);
      
      // Return the phone number and remaining credits
      res.status(200).json({
        success: true,
        data: {
          phoneNumber: client.phoneNumber,
          creditsRemaining: updatedUser.credits.current,
          clientName: client.storeName,
          clientId: client.suggestedClientId,
          creditCost: creditCost,
          clientScore: clientScore,
          scoreCategory: scoreCategory
        },
        message: `Phone number revealed successfully. ${creditCost} credits deducted for ${scoreCategory} score client. Credits remaining: ${updatedUser.credits.current}`
      });
    } catch (error) {
      console.error('Error in revealPhoneNumber:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while revealing the phone number. Please try again.'
      });
    }
  }

  // Enhanced add credits with better validation
  addCredits = async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;
      
      // Validate admin permissions
      if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'CHEF_DE_BUREAU') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can add credits'
        });
      }
      
      // Validate input
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      if (!amount || amount <= 0 || amount > 10000) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number between 1 and 10,000'
        });
      }
      
      // Get the target user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (user.role !== 'CLOSER') {
        return res.status(400).json({
          success: false,
          message: 'Credits can only be added to closers'
        });
      }
      
      // Initialize credits if they don't exist
      if (!user.credits) {
        user.credits = {
          current: 0,
          total: 0,
          used: 0,
          lastRecharge: null,
          history: []
        };
      }
      
      // Add credits using atomic operation
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $inc: {
            'credits.current': amount,
            'credits.total': amount
          },
          $set: {
            'credits.lastRecharge': new Date()
          },
          $push: {
            'credits.history': {
              type: 'recharge',
              amount: amount,
              reason: reason || 'Manual recharge by administrator',
              date: new Date(),
              adminId: req.user._id
            }
          }
        },
        { new: true }
      );
      
      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: 'Failed to add credits'
        });
      }
      
      // Log the credit addition
      console.log(`${amount} credits added to ${user.username} by ${req.user.username} at ${new Date()}`);
      
      res.status(200).json({
        success: true,
        data: {
          userId: updatedUser._id,
          username: updatedUser.username,
          creditsAdded: amount,
          newBalance: updatedUser.credits.current,
          totalCredits: updatedUser.credits.total
        },
        message: `Successfully added ${amount} credits to ${updatedUser.username}`
      });
    } catch (error) {
      console.error('Error in addCredits:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while adding credits. Please try again.'
      });
    }
  }

  // Add this method to your CreditController class:

getCreditHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Allow users to see their own history, admins can see anyone's
    const targetUserId = userId || req.user._id;
    
    if (targetUserId !== req.user._id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'CHEF_DE_BUREAU') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const user = await User.findById(targetUserId)
      .populate('credits.history.adminId', 'username email')
      .select('username credits');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize credits if they don't exist
    if (!user.credits || !user.credits.history) {
      return res.status(200).json({
        success: true,
        data: {
          username: user.username,
          currentCredits: 0,
          history: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }
    
    // Paginate history
    const skip = (page - 1) * limit;
    const history = user.credits.history
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(skip, skip + parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: {
        username: user.username,
        currentCredits: user.credits.current,
        history: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: user.credits.history.length,
          pages: Math.ceil(user.credits.history.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error in getCreditHistory:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching credit history. Please try again.'
    });
  }
}

  // Enhanced get all closers credits with better error handling
  getAllClosersCredits = async (req, res) => {
    try {
      // Check admin permissions
      if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'CHEF_DE_BUREAU') {
        return res.status(403).json({
          success: false,
          message: 'Only administrators can view all credits'
        });
      }
      
      const closers = await User.find({ 
        role: 'CLOSER',
        active: { $ne: false }  // Include users where active is true or undefined
      }).select('username email credits createdAt');
      
      const creditData = closers.map(closer => {
        // Initialize credits if they don't exist
        if (!closer.credits) {
          closer.credits = {
            current: 0,
            total: 0,
            used: 0,
            lastRecharge: null,
            history: []
          };
        }
        
        return {
          id: closer._id,
          username: closer.username,
          email: closer.email,
          credits: {
            current: closer.credits.current || 0,
            total: closer.credits.total || 0,
            used: closer.credits.used || 0,
            percentage: closer.credits.total > 0 ? ((closer.credits.current / closer.credits.total) * 100).toFixed(1) : 0,
            lastRecharge: closer.credits.lastRecharge
          },
          memberSince: closer.createdAt
        };
      });
      
      res.status(200).json({
        success: true,
        data: creditData
      });
    } catch (error) {
      console.error('Error in getAllClosersCredits:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching credit data. Please try again.'
      });
    }
  }



  // Enhanced initialization with better error handling
  initializeCreditsForClosers = async (req, res) => {
    try {
      // Only super admin can initialize
      if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Only super administrators can initialize credits'
        });
      }
      
      const { initialAmount = 100 } = req.body;
      
      if (initialAmount <= 0 || initialAmount > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Initial amount must be between 1 and 1000'
        });
      }
      
      const closers = await User.find({ 
        role: 'CLOSER',
        $or: [
          { 'credits.current': { $exists: false } },
          { 'credits.current': { $eq: null } },
          { 'credits': { $exists: false } }
        ]
      });
      
      let updated = 0;
      const errors = [];
      
      for (const closer of closers) {
        try {
          closer.credits = {
            current: initialAmount,
            total: initialAmount,
            used: 0,
            lastRecharge: new Date(),
            history: [{
              type: 'recharge',
              amount: initialAmount,
              reason: 'Initial credit allocation by system',
              date: new Date(),
              adminId: req.user._id
            }]
          };
          
          await closer.save();
          updated++;
        } catch (error) {
          errors.push(`Failed to initialize credits for ${closer.username}: ${error.message}`);
        }
      }
      
      res.status(200).json({
        success: true,
        message: `Successfully initialized credits for ${updated} closers`,
        data: { 
          updatedClosers: updated,
          totalEligible: closers.length,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } catch (error) {
      console.error('Error in initializeCreditsForClosers:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while initializing credits. Please try again.'
      });
    }
  }
}