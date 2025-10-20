// Simple login verification
exports.login = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (password === process.env.USER_PASSWORD) {
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Incorrect password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};