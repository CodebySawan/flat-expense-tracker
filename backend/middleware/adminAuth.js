// Simple admin authentication middleware
const adminAuth = (req, res, next) => {
  const password = req.headers['admin-password'];
  
  if (password === 'sawan@flat') {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized. Admin access required.' });
  }
};

module.exports = adminAuth;