// routes/zrexpressRoutes.js
import express from 'express';
import { 
  testApiConnection, 
  addPackage, 
  getPackagesList, 
  markPackageAsReady, 
  getPricingInfo, 
  getLatestUpdatedPackages, 
  sendTelegramNotification 
} from '../services/zrexpressService.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Test API connection
router.get('/test', async (req, res) => {
  try {
    const result = await testApiConnection();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to connect to ZRexpress API',
      error: error.message
    });
  }
});

// Add packages (tracking numbers)
router.post('/packages', async (req, res) => {
    try {
      const { packages } = req.body;
      
      if (!packages || !Array.isArray(packages) || packages.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid packages array is required'
        });
      }
      
      // Format the data to match ZRexpress API expectations
      const formattedColis = packages.map(pkg => ({
        "Tracking": pkg.tracking,
        "TypeLivraison": "0",  // Default to home delivery
        "TypeColis": "0",      // Default to regular package
        "Confrimee": "",
        "Client": pkg.client,
        "MobileA": pkg.mobileA,
        "MobileB": pkg.mobileB || "",
        "Adresse": pkg.note || "",
        "IDWilaya": pkg.wilaya,
        "Commune": pkg.commune,
        "Total": pkg.total || "0",
        "Note": pkg.commentaire || "",
        "TProduit": pkg.produit || "",
        "id_Externe": pkg.tracking,  // Use tracking as external ID if none provided
        "Source": ""
      }));
      
      const result = await addPackage(formattedColis);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add packages',
        error: error.message
      });
    }
  });

// Get packages list
router.get('/packages', async (req, res) => {
  try {
    const result = await getPackagesList();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get packages list',
      error: error.message
    });
  }
});

// Mark packages as ready to ship
router.post('/packages/ready',  async (req, res) => {
  try {
    const { packages } = req.body;
    
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid packages array is required'
      });
    }
    
    // Format the packages as expected by the API
    const formattedPackages = packages.map(pkg => ({
      "Tracking": pkg.tracking
    }));
    
    const result = await markPackageAsReady(formattedPackages);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark packages as ready',
      error: error.message
    });
  }
});

// Get pricing information
router.get('/pricing', async (req, res) => {
  try {
    const result = await getPricingInfo();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing information',
      error: error.message
    });
  }
});

// Get latest updated packages
router.get('/packages/latest', async (req, res) => {
  try {
    const result = await getLatestUpdatedPackages();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get latest updated packages',
      error: error.message
    });
  }
});

// Send Telegram notification
router.post('/notify', async (req, res) => {
  try {
    const { chatId, message } = req.body;
    
    if (!chatId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID and message are required'
      });
    }
    
    const result = await sendTelegramNotification(chatId, message);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

export default router;