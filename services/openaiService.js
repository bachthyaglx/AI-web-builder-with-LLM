const OpenAI = require('openai');
const axios = require('axios');

async function validateApiKey(apiKey) {
  const openai = new OpenAI({ apiKey });

  try {
    await openai.models.list();
    console.log('API key validation successful.');
    return { isValid: true, message: 'API key is valid and working.' };
  } catch (error) {
    console.error('Error during API key validation:', error.message, error.stack);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            return { isValid: false, message: 'Invalid API key. Please check and try again.' };
          case 429:
            return { isValid: false, message: 'API key rate limit exceeded. Please try again later.' };
          case 500:
            return { isValid: false, message: 'OpenAI service is currently unavailable. Please try again later.' };
          default:
            return { isValid: false, message: `Error validating API key: ${error.response.statusText}` };
        }
      } else if (error.request) {
        return { isValid: false, message: 'Network error. Please check your internet connection and try again.' };
      }
    }
    return { isValid: false, message: 'Error validating API key: ' + error.message };
  }
}

module.exports = {
  validateApiKey
};