const express = require('express');
const router = express.Router();
const Website = require('../models/Website');
const Page = require('../models/Page');
const { isAuthenticated } = require('./middleware/authMiddleware');

router.use(express.json());  // Add this line to parse JSON bodies

// List all pages for a website
router.get('/websites/:id/pages', isAuthenticated, async (req, res) => {
  try {
    const website = await Website.findOne({ _id: req.params.id, user: req.user._id }).populate('pages');
    if (!website) {
      return res.status(404).send('Website not found');
    }
    res.render('pages', { website });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).send('Error fetching pages');
  }
});

// Add this function to check slug uniqueness
async function isSlugUnique(websiteId, slug, pageId = null) {
  const query = { website: websiteId, slug: slug };
  if (pageId) {
    query._id = { $ne: pageId };
  }
  const existingPage = await Page.findOne(query);
  return !existingPage;
}

// Modify the POST route for creating a new page
router.post('/websites/:id/pages', isAuthenticated, async (req, res) => {
  try {
    console.log('Received page creation request. Body:', req.body);
    const { name, slug, seoTitle, seoDescription } = req.body;
    const websiteId = req.params.id;

    console.log('Extracted data:', { name, slug, seoTitle, seoDescription, websiteId });

    if (!await isSlugUnique(websiteId, slug)) {
      console.log('Slug not unique:', slug);
      return res.status(400).json({ message: 'This slug already exists. Please choose a different one.' });
    }

    const newPage = new Page({
      name,
      slug,
      seoTitle,
      seoDescription,
      website: websiteId
    });

    console.log('New page object before save:', newPage);

    await newPage.save();

    console.log('Page saved successfully');

    const website = await Website.findById(websiteId);
    website.pages.push(newPage._id);
    await website.save();

    console.log('Website updated with new page');

    res.redirect(`/websites/${websiteId}/pages`);
  } catch (error) {
    console.error('Error in page creation:', error);
    res.status(500).send('Error creating page');
  }
});

// Modify the PUT route for updating a page
router.put('/websites/:websiteId/pages/:pageId', isAuthenticated, async (req, res) => {
  try {
    const { websiteId, pageId } = req.params;
    const { name, slug, seoTitle, seoDescription } = req.body;

    if (!await isSlugUnique(websiteId, slug, pageId)) {
      return res.status(400).json({ message: 'This slug already exists. Please choose a different one.' });
    }

    const updatedPage = await Page.findByIdAndUpdate(pageId, {
      name,
      slug,
      seoTitle,
      seoDescription
    }, { new: true });

    if (!updatedPage) {
      return res.status(404).json({ message: 'Page not found' });
    }

    res.json(updatedPage);
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ message: 'Error updating page' });
  }
});

// Edit page form
router.get('/websites/:websiteId/pages/:pageId/edit', isAuthenticated, async (req, res) => {
  try {
    const page = await Page.findOne({ _id: req.params.pageId, website: req.params.websiteId });
    if (!page) {
      return res.status(404).send('Page not found');
    }
    res.render('edit-page', { page, websiteId: req.params.websiteId });
  } catch (error) {
    console.error('Error fetching page for edit:', error);
    res.status(500).send('Error fetching page');
  }
});

// Delete page
router.delete('/websites/:websiteId/pages/:pageId', isAuthenticated, async (req, res) => {
  try {
    const page = await Page.findOneAndDelete({ _id: req.params.pageId, website: req.params.websiteId });
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    await Website.updateOne(
      { _id: req.params.websiteId },
      { $pull: { pages: req.params.pageId } }
    );
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ message: 'Error deleting page' });
  }
});

module.exports = router;