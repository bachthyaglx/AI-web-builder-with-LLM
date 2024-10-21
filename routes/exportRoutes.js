const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('./middleware/authMiddleware');
const Website = require('../models/Website');
const archiver = require('archiver');

router.get('/export', isAuthenticated, async (req, res) => {
  try {
    const websites = await Website.find({ user: req.user._id });
    res.render('export', { websites });
  } catch (error) {
    console.error('Error fetching websites for export:', error);
    res.status(500).send('Error fetching websites for export');
  }
});

router.post('/export/:id', isAuthenticated, async (req, res) => {
  try {
    const website = await Website.findOne({ _id: req.params.id, user: req.user._id }).populate('pages');
    if (!website) {
      return res.status(404).send('Website not found');
    }

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment(`${website.name}.zip`);
    archive.pipe(res);

    // At the beginning of the export route, create a 'css' folder in the archive
    archive.append(null, { name: 'css/' });

    // When adding CSS files to the archive, place them in the 'css' folder
    archive.append(website.header.css, { name: 'css/header.css' });
    archive.append(website.footer.css, { name: 'css/footer.css' });

    // In the page processing loop
    for (const page of website.pages) {
      const fileName = page.slug === '/' ? 'index' : page.slug;
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.name} - ${website.name}</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/header.css">
  <link rel="stylesheet" href="css/footer.css">
  <link rel="stylesheet" href="css/${fileName}.css">
</head>
<body>
  <header>
    ${website.header.content}
  </header>
  <main>
    ${page.sections.map(section => section.content).join('\n')}
  </main>
  <footer>
    ${website.footer.content}
  </footer>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
      `;

      archive.append(htmlContent, { name: `${fileName}.html` });
      const pageCSS = page.sections.map(section => section.css).join('\n');
      archive.append(pageCSS, { name: `css/${fileName}.css` });
    }

    await archive.finalize();
  } catch (error) {
    console.error('Error exporting website:', error);
    res.status(500).send('Error exporting website');
  }
});

module.exports = router;