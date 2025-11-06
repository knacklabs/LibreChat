const { logger } = require('@librechat/data-schemas');

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

/**
 * Validates that required guardrails exist in available guardrails
 * @param {Array<string>} requiredGuardrails - Required guardrails from config
 * @param {Array<Object>} availableGuardrails - Available guardrails from LiteLLM
 * @returns {Object} Validation result with isValid flag and invalid guardrails list
 */
function validateRequiredGuardrails(requiredGuardrails, availableGuardrails) {
  if (!requiredGuardrails || requiredGuardrails.length === 0) {
    return { isValid: true, invalidGuardrails: [] };
  }

  const availableNames = new Set(
    availableGuardrails.map(g => g.guardrail_name || g)
  );

  const invalidGuardrails = requiredGuardrails.filter(
    name => !availableNames.has(name)
  );

  return {
    isValid: invalidGuardrails.length === 0,
    invalidGuardrails,
  };
}

module.exports = {
  fetchGuardrails,
  validateRequiredGuardrails,
};