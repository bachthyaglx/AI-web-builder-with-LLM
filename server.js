// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require('./routes/profileRoutes'); // Added profileRoutes
const websiteRoutes = require('./routes/websiteRoutes'); // Added websiteRoutes
const apiRoutes = require('./routes/apiRoutes'); // Added for handling API routes
const pageRoutes = require('./routes/pageRoutes'); // Added for handling Page routes
const sectionRoutes = require('./routes/sectionRoutes'); // Added for handling Section reordering
const headerFooterRoutes = require('./routes/headerFooterRoutes'); // Added for handling Header/Footer editing
const exportRoutes = require('./routes/exportRoutes'); // Added for handling Export functionality
const User = require('./models/User'); // Add this near the top of the file, after other requires

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  console.error("Error: config environment variables not set. Please create/edit .env configuration file.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setting the templating engine to EJS
app.set("view engine", "ejs");

// Serve static files
app.use(express.static("public"));

// Database connection
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error(`Database connection error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  });

// Session configuration with connect-mongo
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL }),
  }),
);

app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// Logging session creation and destruction
app.use((req, res, next) => {
  const sess = req.session;
  // Make session available to all views
  res.locals.session = sess;
  if (!sess.views) {
    sess.views = 1;
    console.log("Session created at: ", new Date().toISOString());
  } else {
    sess.views++;
    console.log(
      `Session accessed again at: ${new Date().toISOString()}, Views: ${sess.views}, User ID: ${sess.userId || '(unauthenticated)'}`,
    );
  }
  next();
});

// Authentication Routes
app.use(authRoutes);

// Profile Routes - Added for handling profile page and OpenAI API key updates
app.use(profileRoutes);

// Website Routes - Added for handling 'My Sites' page and website operations
app.use(websiteRoutes);

// API Routes - Added for handling API requests
app.use('/api', apiRoutes);

// Page Routes - Added for handling Page operations
app.use(pageRoutes);

// Section Routes - Added for handling Section reordering
app.use('/api', sectionRoutes);

// Header/Footer Routes - Added for handling Header/Footer editing
app.use(headerFooterRoutes);

// Export Routes - Added for handling Export functionality
app.use(exportRoutes);

// Replace the existing root path response with this:
app.get("/", async (req, res) => {
  let apiKeySet = false;
  if (req.session.userId) {
    const user = await User.findById(req.session.userId);
    apiKeySet = user && user.openaiApiKey;
  }
  res.render("index", { apiKeySet });
});

// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  res.status(404).send("Page not found.");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});