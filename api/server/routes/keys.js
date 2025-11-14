const express = require('express');
const router = express.Router();
const { updateUserKey, deleteUserKey, getUserKeyExpiry } = require('../services/UserService');
const { requireJwtAuth } = require('../middleware/');
const axios = require('axios');

router.put('/', requireJwtAuth, async (req, res) => {
  await updateUserKey({ userId: req.user.id, ...req.body });
  res.status(201).send();
});

router.delete('/:name', requireJwtAuth, async (req, res) => {
  const { name } = req.params;
  await deleteUserKey({ userId: req.user.id, name });
  res.status(204).send();
});

router.delete('/', requireJwtAuth, async (req, res) => {
  const { all } = req.query;

  if (all !== 'true') {
    return res.status(400).send({ error: 'Specify either all=true to delete.' });
  }

  await deleteUserKey({ userId: req.user.id, all: true });

  res.status(204).send();
});

router.get('/', requireJwtAuth, async (req, res) => {
  const { name } = req.query;
  const response = await getUserKeyExpiry({ userId: req.user.id, name });
  res.status(200).send(response);
});

/**
 * Get API keys from LiteLLM
 * Proxies request to LiteLLM server (similar to LiteLLM dashboard pattern)
 * GET /api/keys/litellm/api-keys
 */
router.get('/litellm/api-keys', requireJwtAuth, async (req, res) => {
  try {
    const userId = req.user?.id || 'unknown_user';
    console.log('[API Keys] Request received from user:', userId);
    
    // Check if LITELLM_URL is configured
    const liteLLMUrl = process.env.LITELLM_URL;
    if (!liteLLMUrl) {
      console.error('[API Keys] LITELLM_URL environment variable not configured');
      return res.status(500).json({ 
        error: {
          message: 'LiteLLM URL not configured. Please contact your administrator.',
          detail: 'LITELLM_URL environment variable is not set'
        }
      });
    }

    // Get the auth token from the request header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('[API Keys] Missing authorization header from user:', userId);
      return res.status(401).json({ 
        error: {
          message: 'Unauthorized - Missing authentication token',
          detail: 'Authorization header is required'
        }
      });
    }

    const endpoint = `${liteLLMUrl}/key/list`;
    console.log('[API Keys] Forwarding request to LiteLLM endpoint:', endpoint);

    // Build query parameters (following LiteLLM dashboard pattern)
    const queryParams = new URLSearchParams();
    queryParams.append('return_full_object', 'true');

    const queryString = queryParams.toString();
    const finalUrl = queryString ? `${endpoint}?${queryString}` : endpoint;

    console.log('[API Keys] Final request URL:', finalUrl);

    // Forward request to LiteLLM with auth header
    const response = await axios.get(finalUrl, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status code
    });

    console.log('[API Keys] Response status from LiteLLM:', response.status);

    // Handle error responses from LiteLLM
    if (!response.ok && response.status !== 200) {
      const errorData = response.data || {};
      const errorMessage = 
        (errorData?.error && (errorData.error.message || errorData.error)) ||
        errorData?.message ||
        errorData?.detail ||
        JSON.stringify(errorData);

      console.error('[API Keys] Error from LiteLLM:', {
        status: response.status,
        message: errorMessage,
        data: errorData
      });

      // Map LiteLLM error status codes to appropriate HTTP responses
      if (response.status === 401) {
        return res.status(401).json({
          error: {
            message: 'Unauthorized - Invalid or expired token',
            detail: errorMessage
          }
        });
      }

      if (response.status === 403) {
        return res.status(403).json({
          error: {
            message: 'Forbidden - Insufficient permissions',
            detail: errorMessage
          }
        });
      }

      if (response.status === 404) {
        return res.status(404).json({
          error: {
            message: 'API Keys endpoint not found on LiteLLM',
            detail: errorMessage
          }
        });
      }

      if (response.status >= 500) {
        return res.status(502).json({
          error: {
            message: 'LiteLLM server error',
            detail: errorMessage
          }
        });
      }

      return res.status(response.status).json({
        error: {
          message: 'Failed to fetch API keys from LiteLLM',
          detail: errorMessage
        }
      });
    }

    // Success - return the keys to the client
    const keysData = response.data;
    const keyCount = keysData?.keys?.length || keysData?.data?.length || 0;
    console.log('[API Keys] Successfully retrieved', keyCount, 'keys from LiteLLM for user:', userId);

    res.status(200).json(keysData);

  } catch (error) {
    console.error('[API Keys] Exception while fetching keys:', {
      message: error.message,
      code: error.code,
      status: error.response?.status
    });

    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
      console.error('[API Keys] Connection refused - LiteLLM server not reachable at:', process.env.LITELLM_URL);
      return res.status(503).json({
        error: {
          message: 'LiteLLM server is not reachable',
          detail: `Cannot connect to ${process.env.LITELLM_URL}. Please verify LiteLLM is running.`
        }
      });
    }

    if (error.code === 'ENOTFOUND') {
      console.error('[API Keys] DNS resolution failed for:', process.env.LITELLM_URL);
      return res.status(503).json({
        error: {
          message: 'Cannot resolve LiteLLM server address',
          detail: `Invalid or unreachable LiteLLM URL: ${process.env.LITELLM_URL}`
        }
      });
    }

    if (error.code === 'ETIMEDOUT') {
      console.error('[API Keys] Request timeout while connecting to LiteLLM');
      return res.status(504).json({
        error: {
          message: 'LiteLLM request timeout',
          detail: 'Request to LiteLLM took too long. Please try again.'
        }
      });
    }

    // Generic error response
    console.error('[API Keys] Full error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch API keys',
        detail: error.message || 'An unexpected error occurred'
      }
    });

  }
});

module.exports = router;
