const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./middleware/authMiddleware');
const Page = require('../models/Page');

router.put('/websites/:websiteId/pages/:pageId/reorder', isAuthenticated, async (req, res) => {
  try {
    const { websiteId, pageId } = req.params;
    const { order } = req.body;

    const page = await Page.findOne({ _id: pageId, website: websiteId });
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Reorder sections based on the new order
    const reorderedSections = order.map(sectionId =>
      page.sections.find(section => section.sectionReference === sectionId)
    ).filter(section => section !== undefined); // Ensure only valid sections are included

    page.sections = reorderedSections;
    await page.save();

    res.json({ message: 'Section order updated successfully' });
  } catch (error) {
    console.error('Error reordering sections:', error);
    res.status(500).json({ message: 'Error reordering sections', error: error.message });
  }
});

module.exports = router;