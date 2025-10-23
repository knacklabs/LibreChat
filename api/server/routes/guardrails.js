const express = require('express');
const { fetchGuardrails } = require('~/server/services/GuardrailsService');
const { logger } = require('@librechat/data-schemas');
const configMiddleware = require('~/server/middleware/config/app');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');

const router = express.Router();

router.use(requireJwtAuth);
router.use(configMiddleware);

/**
 * GET /api/guardrails
 * Fetches available guardrails from LiteLLM
 */
router.get('/', async (req, res) => {
  try {
    // Resolve LiteLLM from custom endpoints by name (e.g., name: "litellm")
    // const litellmConfig = req.config?.endpoints?.custom?.find(
    //   (ep) => (ep?.name || '').toLowerCase() === 'litellm'
    // );


    // if (!litellmConfig) {
    //   return res
    //     .status(400)
    //     .json({ error: 'LiteLLM endpoint not configured in LibreChat config' });
    // }

    // const baseURL = litellmConfig.baseURL;
    // const apiKey = litellmConfig.apiKey;
    const baseURL = process.env.LITELLM_URL;
    // const apiKey = process.env.LITELLM_API_KEY || "default_api_key";

    
    if (!baseURL) {
      return res.status(400).json({ error: 'LiteLLM base URL not configured' });
    }

    const headers = {};
    
    // Use authorization from request or config
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    } else if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const guardrails = await fetchGuardrails(baseURL, headers);
    
    res.json({ guardrails });
  } catch (error) {
    logger.error('[GuardrailsRoute] Error fetching guardrails:', error);
    res.status(500).json({ error: 'Failed to fetch guardrails' });
  }
});

module.exports = router;
