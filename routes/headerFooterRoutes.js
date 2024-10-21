const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./middleware/authMiddleware');
const Website = require('../models/Website');
const User = require('../models/User');
const Page = require('../models/Page'); // Added for fetching 'Home' pages
const { sendLLMRequest } = require('../services/llm');

router.get('/websites/:id/header-footer', isAuthenticated, async (req, res) => {
  try {
    const website = await Website.findOne({ _id: req.params.id, user: req.user._id });
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }
    res.render('header-footer-editor', {
      website: {
        id: website._id,
        name: website.name,
        header: website.header,
        footer: website.footer
      }
    });
  } catch (error) {
    console.error('Error fetching website:', error);
    res.status(500).json({ message: 'Error fetching website', error: error.message });
  }
});

router.post('/websites/:id/generate-header-footer', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'header' or 'footer'

    const website = await Website.findOne({ _id: id, user: req.user._id });
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.openaiApiKey) {
      return res.status(400).json({ message: 'OpenAI API key not set for this user' });
    }

    // Fetch pages with 'Home' in their names
    const homePages = await Page.find({
      website: id,
      name: { $regex: /home/i }
    });

    let homePageContent = '';
    let homePageStyles = '';
    homePages.forEach(page => {
      homePageContent += page.sections.map(section => section.content).join('\n');
      homePageStyles += page.sections.map(section => section.css).join('\n');
    });

    const prompt = `Generate HTML and CSS for a ${type} for a website with the following context: "${website.context}".
    Customization details: Target Audience: ${website.customization.targetAudience},
    Main Goal: ${website.customization.mainGoal},
    Unique Selling Point: ${website.customization.uniqueSellingPoint},
    Brand Personality: ${website.customization.brandPersonality}.
    CSS Framework: Bootstrap 5 Latest.
    Return the result as a JSON object with 'content' (HTML) and 'css' fields.`;

    const llmResponse = await sendLLMRequest('openai', 'gpt-3.5-turbo', prompt, user.openaiApiKey, true);
    const { content, css } = llmResponse;

    website[type] = { content, css };
    await website.save();

    res.json({ content, css });
  } catch (error) {
    console.error(`Error generating ${type}:`, error);
    res.status(500).json({ message: `Error generating ${type}`, error: error.message });
  }
});

router.put('/websites/:id/edit-header-footer', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description } = req.body; // 'header' or 'footer'

    const website = await Website.findOne({ _id: id, user: req.user._id });
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.openaiApiKey) {
      return res.status(400).json({ message: 'OpenAI API key not set for this user' });
    }

    // Fetch pages with 'Home' in their names
    const homePages = await Page.find({
      website: id,
      name: { $regex: /home/i }
    });

    let homePageContent = '';
    let homePageStyles = '';
    homePages.forEach(page => {
      homePageContent += page.sections.map(section => section.content).join('\n');
      homePageStyles += page.sections.map(section => section.css).join('\n');
    });

    const prompt = `Edit the ${type} for a website with the following context: "${website.context}".
    Current ${type} HTML: "${website[type].content}".
    Current ${type} CSS: "${website[type].css}".
    Customization details: Target Audience: ${website.customization.targetAudience},
    Main Goal: ${website.customization.mainGoal},
    Unique Selling Point: ${website.customization.uniqueSellingPoint},
    Brand Personality: ${website.customization.brandPersonality}.
    CSS Framework: Bootstrap 5 Latest.
    Edit based on this description: ${description}.
    Return the result as a JSON object with 'content' (HTML) and 'css' fields.`;

    const llmResponse = await sendLLMRequest('openai', 'gpt-3.5-turbo', prompt, user.openaiApiKey, true);
    const { content, css } = llmResponse;

    website[type] = { content, css };
    await website.save();

    res.json({ content, css });
  } catch (error) {
    console.error(`Error editing ${type}:`, error);
    res.status(500).json({ message: `Error editing ${type}`, error: error.message });
  }
});

router.get('/websites/:id/preview-header-footer/:type', isAuthenticated, async (req, res) => {
  try {
    const { id, type } = req.params;
    const website = await Website.findOne({ _id: id, user: req.user._id });
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }
    res.render('header-footer-preview', {
      type,
      content: website[type].content,
      css: website[type].css,
      websiteName: website.name
    });
  } catch (error) {
    console.error(`Error previewing ${type}:`, error);
    res.status(500).json({ message: `Error previewing ${type}`, error: error.message });
  }
});

module.exports = router;