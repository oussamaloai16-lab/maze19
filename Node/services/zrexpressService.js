// services/zrexpressService.js
import axios from 'axios';

const BASE_URL = 'https://procolis.com/api_v1';
const TOKEN = process.env.ZREXPRESS_TOKEN;
const CLE = process.env.ZREXPRESS_CLE;

const headers = {
  'token': TOKEN,
  'key': CLE
};

// Test API connection
const testApiConnection = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/token`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error testing ZRexpress API connection:', error);
    throw error;
  }
};

// Add tracking packages (Colis)
const addPackage = async (colisData) => {
    try {
      // Format exactly as shown in the API example
      const payload = {
        "Colis": colisData
      };
      
      console.log("Sending to ZRexpress:", JSON.stringify(payload));
      
      const response = await axios.post(`${BASE_URL}/add_colis`, payload, { 
        headers: headers 
      });
      console.log('response',response)
      
      return response.data;
    } catch (error) {
      console.error('Error adding packages to ZRexpress:', error);
      throw error;
    }
  };

// Get list of packages (tracking)
const getPackagesList = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/lire`, {}, { headers });
    return response.data;
  } catch (error) {
    console.error('Error getting packages list from ZRexpress:', error);
    throw error;
  }
};

// Mark packages as ready to ship
const markPackageAsReady = async (packagesData) => {
  try {
    const response = await axios.post(`${BASE_URL}/pret`, {
      "Colis": packagesData
    }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error marking packages as ready in ZRexpress:', error);
    throw error;
  }
};

// Get pricing information
const getPricingInfo = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/tarification`, {}, { headers });
    return response.data;
  } catch (error) {
    console.error('Error getting pricing info from ZRexpress:', error);
    throw error;
  }
};

// Get latest updated packages
const getLatestUpdatedPackages = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/tarification`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error getting latest updated packages from ZRexpress:', error);
    throw error;
  }
};

// Send Telegram notification
const sendTelegramNotification = async (chatId, message) => {
  try {
    const response = await axios.post(`${BASE_URL}/telegram/notify`, {
      chat_id: chatId,
      message: message
    }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    throw error;
  }
};

export { 
  testApiConnection, 
  addPackage, 
  getPackagesList, 
  markPackageAsReady, 
  getPricingInfo, 
  getLatestUpdatedPackages, 
  sendTelegramNotification 
};