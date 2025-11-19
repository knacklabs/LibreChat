const { logger } = require('@librechat/data-schemas');
const { EModelEndpoint } = require('librechat-data-provider');
const { getModelsConfig } = require('~/server/controllers/ModelController');

/**
 * Middleware to route Vertex AI Anthropic models to the Google endpoint
 * Models with provider 'vertex_ai-anthropic_models' must use the Google client
 * instead of the Anthropic client
 *
 * @async
 * @param {ServerRequest} req - The Express request object.
 * @param {Express.Response} res - The Express response object.
 * @param {Function} next - The Express next function.
 */
const routeVertexAIAnthropic = async (req, res, next) => {
  const { model, endpoint } = req.body;
  
  // Only process if this is an anthropic endpoint request
  if (!model || endpoint !== EModelEndpoint.anthropic) {
    return next();
  }

  try {
    const modelsConfig = await getModelsConfig(req);
    
    if (modelsConfig && modelsConfig._modelProviders) {
      const provider = modelsConfig._modelProviders[model];
      
      // If this model is a Vertex AI Anthropic model, route it to Google endpoint
      if (provider === 'vertex_ai-anthropic_models') {
        logger.info(`[routeVertexAIAnthropic] Routing model "${model}" to Google endpoint (vertex_ai-anthropic_models)`);
        // Change the endpoint to google so it uses the Google client
        req.body.endpoint = EModelEndpoint.google;
      }
    }
  } catch (error) {
    logger.warn(`[routeVertexAIAnthropic] Error checking model provider: ${error.message}`);
    // Continue without routing change if there's an error
  }

  return next();
};

module.exports = routeVertexAIAnthropic;
