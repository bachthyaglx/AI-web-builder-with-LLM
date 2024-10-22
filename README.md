# PythaPress

PythaPress is a web application that enables registered users to build and organize multiple websites by interacting with a Large Language Model (LLM) in natural language, in real-time. Users can create, edit, and manage website sections and templates, all while previewing their changes live.

## Overview

PythaPress leverages the Node.js, Express, and MongoDB stack to provide a robust backend, while using EJS for templating and Bootstrap for responsive design. The application is designed to be user-friendly, making it accessible even to users with a non-technical background.

### Technologies Used:

- **Node.js**: JavaScript runtime for building the application.
- **Express**: Web server framework for Node.js.
- **MongoDB**: NoSQL database for storing user data, websites, and pages.
- **Mongoose**: MongoDB ORM for Node.js.
- **bcrypt**: Library for hashing passwords.
- **express-session**: Session middleware for Express.
- **EJS**: Embedded JavaScript templating.
- **axios**: Promise-based HTTP client.
- **dotenv**: Module to load environment variables from a .env file.
- **nodemon**: Tool for automatically restarting the node application when file changes are detected.
- **cors**: Express middleware to enable CORS.
- **Bootstrap**: Frontend framework for developing responsive websites.
- **jQuery**: JavaScript library for DOM manipulation.

### Project Structure:
```
PythaPress/
├── models/
│   ├── Page.js
│   ├── User.js
│   └── Website.js
├── public/
│   ├── css/
│   │   ├── spinner.css
│   │   ├── style.css
│   │   └── website-builder.css
│   ├── js/
│   │   ├── main.js
│   │   ├── my-sites.js
│   │   ├── pages.js
│   │   ├── website-builder.js
│   │   └── website-customize.js
├── routes/
│   ├── apiRoutes.js
│   ├── authRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── pageRoutes.js
│   ├── profileRoutes.js
│   └── websiteRoutes.js
├── services/
│   ├── llm.js
│   └── openaiService.js
├── views/
│   ├── edit-page.ejs
│   ├── edit-website.ejs
│   ├── index.ejs
│   ├── login.ejs
│   ├── my-sites.ejs
│   ├── pages.ejs
│   ├── partials/
│   │   ├── _footer.ejs
│   │   ├── _head.ejs
│   │   └── _header.ejs
│   ├── profile.ejs
│   ├── register.ejs
│   ├── website-builder.ejs
│   └── website-customize.ejs
├── .env
├── .env.example
├── package.json
└── server.js
```
## Features

- **Website Builder**: Create, edit, and delete sections of a website in real-time using natural language.
- **Template Management**: Save sections as templates and reuse them across different websites.
- **Page Management**: Organize websites into multiple pages, each with its own sections.
- **Customization**: Customize websites by answering intelligent questions to generate effective copy and design.
- **Real-time Preview**: View changes in real-time with a split-screen interface.
- **User Authentication**: Session-based authentication for secure access.
- **API Key Management**: Set and validate OpenAI API keys through the user profile page.
- **Visual Cues**: Visual indicators to enhance user experience and guide users through the app.
- **Spinner and Toast Notifications**: Visual feedback for user actions and LLM responses.

## Getting Started

### Requirements

- Node.js
- MongoDB (local or cloud version such as MongoDB Atlas)

### Quickstart

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/PythaPress.git
   cd PythaPress
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy the `.env.example` file to `.env` and fill in the required values:
     ```bash
     cp .env.example .env
     ```

4. **Start the application:**
   ```bash
   npm start
   ```

5. **Access the application:**
   - Open your browser and navigate to `http://localhost:3000`.

### License

The project is open source, licensed under the MIT License. See the [LICENSE](LICENSE).

Copyright © 2024 Pythagora-io. 
