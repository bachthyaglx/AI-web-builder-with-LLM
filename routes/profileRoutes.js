const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated } = require('./middleware/authMiddleware');
const { validateApiKey } = require('../services/openaiService');

router.get('/profile', isAuthenticated, (req, res) => {
  res.render('profile', { user: req.user, message: null, error: null });
});

router.post('/profile', isAuthenticated, async (req, res) => {
  try {
    const { openaiApiKey } = req.body;

    if (!openaiApiKey || openaiApiKey.trim() === '') {
      return res.render('profile', { user: req.user, message: null, error: 'API key cannot be empty.' });
    }

    if (openaiApiKey === '*'.repeat(32)) {
      return res.render('profile', { user: req.user, message: 'No changes made to API key.', error: null });
    }

    const validationResult = await validateApiKey(openaiApiKey);

    if (validationResult.isValid) {
      await User.findByIdAndUpdate(req.user._id, { openaiApiKey });
      req.user.openaiApiKey = openaiApiKey;
      res.render('profile', { user: req.user, message: 'API key saved successfully.', error: null });
    } else {
      res.render('profile', { user: req.user, message: null, error: validationResult.message });
    }
  } catch (error) {
    console.error('Error saving API key:', error.message, error.stack);
    res.render('profile', { user: req.user, message: null, error: 'An unexpected error occurred. Please try again later.' });
  }
});

module.exports = router;