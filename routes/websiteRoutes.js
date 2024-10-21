const express = require('express');
const router = express.Router();
const Website = require('../models/Website');
const Page = require('../models/Page');
const mongoose = require('mongoose');
const { isAuthenticated } = require('./middleware/authMiddleware');

// Get all websites for the logged-in user
router.get('/my-sites', isAuthenticated, async (req, res) => {
  try {
    const websites = await Website.find({ user: req.user._id });
    console.log('Fetched websites:', websites); // Add this log
    res.render('my-sites', { websites });
  } catch (error) {
    console.error('Error fetching websites:', error);
    res.status(500).send('Error fetching websites');
  }
});

// Add a new website
router.post('/my-sites', isAuthenticated, async (req, res) => {
  try {
    const { name, context } = req.body;
    const newWebsite = new Website({
      name,
      context,
      user: req.user._id
    });
    await newWebsite.save();
    res.redirect('/my-sites');
  } catch (error) {
    console.error('Error adding website:', error);
    res.status(500).send('Error adding website');
  }
});

// GET route for editing a website
router.get('/my-sites/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const website = await Website.findOne({ _id: req.params.id, user: req.user._id });
    if (!website) {
      return res.status(404).send('Website not found');
    }
    res.render('edit-website', { website });
  } catch (error) {
    console.error('Error fetching website for edit:', error);
    res.status(500).send('Error fetching website');
  }
});

// POST route for updating a website
router.post('/my-sites/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const { name, context } = req.body;
    const website = await Website.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { name, context }, { new: true });
    if (!website) {
      return res.status(404).send('Website not found');
    }
    res.redirect('/my-sites');
  } catch (error) {
    console.error('Error updating website:', error);
    res.status(500).send('Error updating website');
  }
});

// Add this route at the end of the file
router.delete('/my-sites/:id', isAuthenticated, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const result = await Website.findOneAndDelete({ _id: websiteId, user: req.user._id });
    if (!result) {
      return res.status(404).json({ message: 'Website not found' });
    }
    res.json({ message: 'Website deleted successfully' });
  } catch (error) {
    console.error('Error deleting website:', error);
    res.status(500).json({ message: 'Error deleting website' });
  }
});

// GET route for the website builder
router.get('/builder/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { page: pageId } = req.query;

    const website = await Website.findOne({ _id: id, user: req.user._id });
    console.log('Website data:', website);

    if (!website) {
      return res.status(404).send('Website not found');
    }

    let page = null;
    if (pageId) {
      page = await Page.findOne({ _id: pageId, website: id });
      console.log('Page data:', page);
      if (!page) {
        return res.status(404).send('Page not found');
      }
    }

    console.log('Rendering website-builder with:', { website, page });
    res.render('website-builder', { website, page });
  } catch (error) {
    console.error('Error in website builder:', error);
    res.status(500).send('An error occurred');
  }
});

// New route for Website Customization page
router.get('/my-sites/:id/customize', isAuthenticated, async (req, res) => {
  try {
    const website = await Website.findOne({ _id: req.params.id, user: req.user._id });
    if (!website) {
      console.log('Website not found for customization');
      return res.status(404).send('Website not found');
    }
    console.log('Website customization data:', website.customization);
    res.render('website-customize', { website });
  } catch (error) {
    console.error('Error loading website customization page:', error);
    res.status(500).send('Error loading website customization page');
  }
});

// Updated route for live preview to handle both page IDs and slugs
router.get('/websites/:id/preview/:pageIdOrSlug', isAuthenticated, async (req, res) => {
  try {
    const { id, pageIdOrSlug } = req.params;

    const website = await Website.findOne({ _id: id, user: req.user._id });
    if (!website) {
      return res.status(404).send('Website not found');
    }

    let page;
    // Try to find the page by ID first
    if (mongoose.Types.ObjectId.isValid(pageIdOrSlug)) {
      page = await Page.findOne({ _id: pageIdOrSlug, website: id });
    }

    // If not found by ID, try to find by slug
    if (!page) {
      page = await Page.findOne({ slug: pageIdOrSlug, website: id });
    }

    if (!page) {
      return res.status(404).send('Page not found');
    }

    const pages = await Page.find({ website: id });

    res.render('website-preview', { website, page, pages });
  } catch (error) {
    console.error('Error rendering preview:', error);
    res.status(500).send('Error rendering preview');
  }
});

module.exports = router;