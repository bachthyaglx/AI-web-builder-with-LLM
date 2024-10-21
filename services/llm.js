const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

function createOpenAIClient(apiKey) {
  return new OpenAI({ apiKey });
}

function createAnthropicClient(apiKey) {
  return new Anthropic({ apiKey });
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseJSONResponse(response) {
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    return null;
  }
}

async function sendRequestToOpenAI(apiKey, model, message, expectJson = false) {
  const openai = createOpenAIClient(apiKey);
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(`Sending request to OpenAI with model: ${model}`);
      console.log(`Message sent to OpenAI: ${message}`);
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
      });
      const content = response.choices[0].message.content;
      console.log(`Received response from OpenAI: ${content}`);

      if (expectJson) {
        const jsonResponse = parseJSONResponse(content);
        if (jsonResponse) {
          return jsonResponse;
        }
        if (i === MAX_RETRIES - 1) {
          throw new Error('Failed to parse JSON response after multiple attempts');
        }
      } else {
        return content;
      }
    } catch (error) {
      console.error(`Error sending request to OpenAI (attempt ${i + 1}):`, error.message, error.stack);
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(RETRY_DELAY);
    }
  }
}

async function sendRequestToAnthropic(apiKey, model, message, expectJson = false) {
  const anthropic = createAnthropicClient(apiKey);
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(`Sending request to Anthropic with model: ${model} and message: ${message}`);
      const response = await anthropic.messages.create({
        model: model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
      });
      const content = response.content[0].text;
      console.log(`Received response from Anthropic: ${content}`);

      if (expectJson) {
        const jsonResponse = parseJSONResponse(content);
        if (jsonResponse) {
          return jsonResponse;
        }
        if (i === MAX_RETRIES - 1) {
          throw new Error('Failed to parse JSON response after multiple attempts');
        }
      } else {
        return content;
      }
    } catch (error) {
      console.error(`Error sending request to Anthropic (attempt ${i + 1}):`, error.message, error.stack);
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(RETRY_DELAY);
    }
  }
}

async function sendLLMRequest(provider, model, message, apiKey, expectJson = false) {
  switch (provider.toLowerCase()) {
    case 'openai':
      return sendRequestToOpenAI(apiKey, model, message, expectJson);
    case 'anthropic':
      return sendRequestToAnthropic(apiKey, model, message, expectJson);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

module.exports = {
  sendLLMRequest
};