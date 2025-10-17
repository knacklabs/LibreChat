const { logger } = require('~/utils');

/**
 * Fetches available guardrails from LiteLLM endpoint
 * @param {string} baseURL - The LiteLLM base URL
 * @param {Object} headers - Request headers
 * @returns {Promise<Array>} Array of available guardrails
 */
async function fetchGuardrails(baseURL, headers = {}) {
  try {
    const response = await fetch(`${baseURL}/guardrails/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      logger.warn('[GuardrailsService] Failed to fetch guardrails:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data.guardrails || [];
  } catch (error) {
    logger.error('[GuardrailsService] Error fetching guardrails:', error);
    return [];
  }
}

module.exports = {
  fetchGuardrails,
};