const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./middleware/authMiddleware');
const Website = require('../models/Website');
const Page = require('../models/Page');
const User = require('../models/User');
const { sendLLMRequest } = require('../services/llm');

router.post('/websites/:id/sections', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const { page: pageId } = req.query;

    console.log(`Received request for website ID: ${id}`);
    console.log(`Description: ${description}`);

    const website = await Website.findOne({ _id: id, user: req.user._id });
    if (!website) {
      console.log(`Website not found for ID: ${id}`);
      return res.status(404).json({ message: 'Website not found' });
    }

    console.log(`Website found: ${JSON.stringify(website)}`);

    const user = await User.findById(req.user._id);
    if (!user || !user.openaiApiKey) {
      return res.status(400).json({ message: 'OpenAI API key not set for this user' });
    }

    let page;
    if (pageId) {
      page = await Page.findOne({ _id: pageId, website: id });
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
    }

    const sectionReference = `section-${Date.now()}`;
    const prompt = `*Website Context:* "${website.context}".\n\n*Existing Page Content:* "${page ? JSON.stringify(page.sections) : ''}"\n\n*Website Customization:*\nTarget Audience: ${website.customization.targetAudience}\nMain Goal: ${website.customization.mainGoal}\nUnique Selling Point: ${website.customization.uniqueSellingPoint}\nBrand Personality: ${website.customization.brandPersonality}\nCSS Framework: Bootstrap 5 Latest\n\nGiven the website context, existing page content, and customization information, generate HTML for a new website section based on this description: ${description}. The HTML should align with the website's context, design considerations, and customization details. Also, provide appropriate CSS for this section, using the section-reference '#${sectionReference}' as the parent for all styled elements - which are children of the section element. Ensure that all CSS selectors - which are children of the section - start with #${sectionReference}; and the section element itself should have the CSS selector #${sectionReference}. Return the result as a JSON object with 'content' - section html - and 'css' - section css - fields.`;
    console.log(`Updated prompt sent to LLM: ${prompt}`);

    const llmResponse = await sendLLMRequest('openai', 'gpt-3.5-turbo', prompt, user.openaiApiKey, true);
    const { content, css } = llmResponse;

    console.log('LLM Response:', llmResponse);
    console.log('Section content:', content);
    console.log('Section CSS:', css);

    const newSection = {
      sectionReference,
      content,
      css
    };

    if (page) {
      page.sections.push(newSection);
      await page.save();
    }

    res.json(newSection);
  } catch (error) {
    console.error('Error adding section:', error.message, error.stack);
    res.status(500).json({ message: 'Error adding section', error: error.message });
  }
});

router.get('/websites/:websiteId/pages/:pageId', isAuthenticated, async (req, res) => {
  console.log('GET request received for websiteId:', req.params.websiteId, 'pageId:', req.params.pageId);
  try {
    const { websiteId, pageId } = req.params;
    const page = await Page.findOne({ _id: pageId, website: websiteId });
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.json(page);
  } catch (error) {
    console.error('Error fetching page content:', error);
    res.status(500).json({ message: 'Error fetching page content' });
  }
});

router.put('/websites/:id/sections/:sectionId', isAuthenticated, async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { description } = req.body;
    const { page: pageId } = req.query;

    console.log('Editing section. Params:', req.params);
    console.log('Request body:', req.body);

    const website = await Website.findOne({ _id: id, user: req.user._id });
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.openaiApiKey) {
      return res.status(400).json({ message: 'OpenAI API key not set for this user' });
    }

    let page;
    if (pageId) {
      page = await Page.findOne({ _id: pageId, website: id });
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
    }

    // Find the existing section
    const existingSection = page.sections.find(s => s.sectionReference === sectionId);
    if (!existingSection) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const prompt = `*Website Context:* "${website.context}".\n\n*Website Customization:*\nTarget Audience: ${website.customization.targetAudience}\nMain Goal: ${website.customization.mainGoal}\nUnique Selling Point: ${website.customization.uniqueSellingPoint}\nBrand Personality: ${website.customization.brandPersonality}\nCSS Framework: Bootstrap 5 Latest\n\n*Current Section Content:* "${existingSection.content}"\n\n*Current Section CSS:* "${existingSection.css}"\n\nEdit the current section content and CSS based on this description: ${description}. The HTML and CSS should align with the website's context, design considerations, and customization information. Use the section-reference '#${sectionId}' as the parent for all styled elements - which are children of the section element. Ensure that all CSS selectors - which are children of the section - start with #${sectionId}; and the section element itself should have the CSS selector #${sectionId}. Return the result as a JSON object with 'content' - section html - and 'css' - section css - fields. Ensure the correct format of response JSON because the resposne will directly be passed to JSON.parse in Nodejs.`;

    const llmResponse = await sendLLMRequest('openai', 'gpt-3.5-turbo', prompt, user.openaiApiKey, true);
    const { content, css } = llmResponse;

    console.log('LLM response:', { content, css });

    // Update the section
    existingSection.content = content;
    existingSection.css = css;
    await page.save();

    res.json(existingSection);
  } catch (error) {
    console.error('Error editing section:', error.message, error.stack);
    res.status(500).json({ message: 'Error editing section', error: error.message });
  }
});

router.post('/websites/:id/customize', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { targetAudience, mainGoal, uniqueSellingPoint, brandPersonality } = req.body;

    const website = await Website.findOne({ _id: id, user: req.user._id });
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }

    website.customization = {
      targetAudience,
      mainGoal,
      uniqueSellingPoint,
      brandPersonality
    };

    await website.save();

    res.json({ message: 'Website customization saved successfully' });
  } catch (error) {
    console.error('Error saving website customization:', error.message, error.stack);
    res.status(500).json({ message: 'Error saving website customization', error: error.message });
  }
});

router.delete('/websites/:id/sections/:sectionId', isAuthenticated, async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { page: pageId } = req.query;

    const website = await Website.findOne({ _id: id, user: req.user._id });
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }

    let page;
    if (pageId) {
      page = await Page.findOne({ _id: pageId, website: id });
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
    }

    // Remove the section from the page
    page.sections = page.sections.filter(section => section.sectionReference !== sectionId);
    await page.save();

    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error.message, error.stack);
    res.status(500).json({ message: 'Error deleting section', error: error.message });
  }
});

router.post('/websites/:id/sections/:sectionId/copy', isAuthenticated, async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { page: pageId } = req.query;

    console.log('Copying section. Params:', req.params);

    const website = await Website.findOne({ _id: id, user: req.user._id });
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }

    let page;
    if (pageId) {
      page = await Page.findOne({ _id: pageId, website: id });
      if (!page) {
        return res.status(404).json({ message: 'Page not found' });
      }
    }

    const existingSection = page.sections.find(s => s.sectionReference === sectionId);
    if (!existingSection) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const newSectionReference = `section-${Date.now()}`;
    const newSection = {
      sectionReference: newSectionReference,
      content: existingSection.content.replace(
        new RegExp(`id="${sectionId}"`, 'g'),
        `id="${newSectionReference}"`
      ),
      css: existingSection.css.replace(new RegExp(sectionId, 'g'), newSectionReference)
    };

    console.log('New section created:', newSection);

    page.sections.push(newSection);
    await page.save();

    res.json(newSection);
  } catch (error) {
    console.error('Error copying section:', error.message, error.stack);
    res.status(500).json({ message: 'Error copying section', error: error.message });
  }
});

module.exports = router;