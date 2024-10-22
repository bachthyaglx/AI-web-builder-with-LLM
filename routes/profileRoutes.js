const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated } = require('./middleware/authMiddleware');
const { validateApiKey } = require('../services/openaiService');

router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render('profile', { user, message: null, error: null });
  } catch (error) {
    console.error('Error fetching profile:', error.message, error.stack);
    res.status(500).send('Error fetching profile');
  }
});

router.post('/profile', isAuthenticated, async (req, res) => {
  try {
    const { openaiApiKey, email } = req.body;
    const updates = {};
    if (email) updates.email = email;

    if (openaiApiKey && openaiApiKey.trim() !== '') {
      const validationResult = await validateApiKey(openaiApiKey);
      if (validationResult.isValid) {
        updates.openaiApiKey = openaiApiKey;
      } else {
        return res.render('profile', { user: req.user, message: null, error: validationResult.message });
      }
    }

    await User.findByIdAndUpdate(req.session.userId, updates);
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating profile:', error.message, error.stack);
    res.status(500).send('Error updating profile');
  }
});

module.exports = router;