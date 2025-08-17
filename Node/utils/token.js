const jwt = require('jsonwebtoken');

const generateToken = (userId, secret = process.env.Maze_09_Tipaza_XDNL, expiresIn = '24h') => {
  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, secret, { expiresIn });
};

// Example usage
const token = generateToken();
console.log('encoded',token);

// Verify token
const decoded = jwt.verify(token, process.env.Maze_09_Tipaza_XDNL);
console.log(decoded);