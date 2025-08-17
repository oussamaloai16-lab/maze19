// utils/trackingUtils.js
export const generateTrackingId = () => {
    // Generate a random tracking ID with a prefix
    const prefix = 'ZRT';
    const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomDigits = '0123456789';
    
    let trackingId = prefix;
    
    // Add random character
    trackingId += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    
    // Add random 3-digit number
    for (let i = 0; i < 3; i++) {
      trackingId += randomDigits.charAt(Math.floor(Math.random() * randomDigits.length));
    }
    
    return trackingId;
  };