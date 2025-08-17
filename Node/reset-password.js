import bcrypt from 'bcrypt';

const generateNewPassword = async (newPassword) => {
  try {
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('🔐 New Password Hash Generated:');
    console.log(`Password: "${newPassword}"`);
    console.log(`Hash: "${newHash}"`);
    console.log('\n📝 Update this hash in your database/config file');
    
    return newHash;
  } catch (error) {
    console.error('Error generating hash:', error);
  }
};

// Generate new password hash
const newPassword = 'rachidmaze'; // Change this to your desired password
generateNewPassword(newPassword); 