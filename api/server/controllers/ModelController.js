const { logger } = require('@librechat/data-schemas');
const { CacheKeys, EModelEndpoint } = require('librechat-data-provider');
const { loadDefaultModels, loadConfigModels } = require('~/server/services/Config');
const { getLogStores } = require('~/cache');
const axios = require('axios');

/**
 * @param {ServerRequest} req
 * @returns {Promise<TModelsConfig>} The models config.
 */
const getModelsConfig = async (req) => {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  let modelsConfig = await cache.get(CacheKeys.MODELS_CONFIG);
  if (!modelsConfig) {
    modelsConfig = await loadModels(req);
  }

  return modelsConfig;
};

/**
 * Loads the models from the config.
 * @param {ServerRequest} req - The Express request object.
 * @returns {Promise<TModelsConfig>} The models config.
 */
async function loadModels(req) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cachedModelsConfig = await cache.get(CacheKeys.MODELS_CONFIG);
  if (cachedModelsConfig) {
    return cachedModelsConfig;
  }
  const defaultModelsConfig = await loadDefaultModels(req);
  const customModelsConfig = await loadConfigModels(req);

  const modelConfig = { ...defaultModelsConfig, ...customModelsConfig };

  await cache.set(CacheKeys.MODELS_CONFIG, modelConfig);
  return modelConfig;
}

async function loadModelsFromLiteLLM(req) {
  const modelsConfig = {};
  const modelProviderMap = {}; // Map of model name to provider
  
  try {
    const litellmUrl = process.env.LITELLM_URL || 'http://localhost:4000';
    
    const response = await axios.get(`${litellmUrl}/model/info`, {
      headers: {
        'Authorization': req.headers.authorization,
      },
    });
    
    const modelData = response.data;
    
    if (!modelData?.data || !Array.isArray(modelData.data)) {
      logger.error('Invalid response from LiteLLM API');
      return modelsConfig;
    }
    
    // Group models by their provider
    const modelsByProvider = {
      [EModelEndpoint.openAI]: [],
      [EModelEndpoint.anthropic]: [],
      [EModelEndpoint.google]: [],
      [EModelEndpoint.custom]: [],
    };
    
    // Filter and categorize models
    modelData.data.forEach((model) => {
      // Skip embedding models
      if (model.model_info?.mode === 'embedding') {
        return;
      }
      
      const provider = model.model_info?.litellm_provider;
      const modelName = model.model_name;
      
      if (!provider || !modelName) {
        return;
      }
      
      // Store provider information for later lookup
      modelProviderMap[modelName] = provider;
      
      // Map providers to endpoints
      if (provider === 'openai') {
        modelsByProvider[EModelEndpoint.openAI].push(modelName);
      } else if (provider === 'anthropic' || provider === 'vertex_ai-anthropic_models') {
        // Both direct Anthropic and Vertex AI Anthropic models are listed under anthropic endpoint
        modelsByProvider[EModelEndpoint.anthropic].push(modelName);
      } else if (provider === 'google' || provider === 'gemini' || provider === 'vertex_ai-language-models') {
        modelsByProvider[EModelEndpoint.google].push(modelName);
      } else if (provider === 'bedrock') {
        modelsByProvider[EModelEndpoint.bedrock].push(modelName);
      }
    });
    
    // Only add endpoints that have models
    Object.keys(modelsByProvider).forEach((endpoint) => {
      if (modelsByProvider[endpoint].length > 0) {
        modelsConfig[endpoint] = modelsByProvider[endpoint];
      }
    });
    
    // Store provider map for identifying vertex_ai-anthropic models
    modelsConfig._modelProviders = modelProviderMap;
    
    logger.info(`Loaded ${Object.keys(modelsConfig).length} endpoints from LiteLLM`);
    
  } catch (error) {
    logger.error('Error fetching models from LiteLLM:', error);
  }
  
  return modelsConfig;
}
async function modelController(req, res) {
  if (process.env.LITELLM_URL) {
    try {
      const modelConfig = await loadModelsFromLiteLLM(req);

      res.send(modelConfig);
    } catch (error) {
      logger.error('Error sending models:', error);
      res.status(500).send({ error: error.message });
    }
  } else {
    try {
      const modelConfig = await loadModels(req);
      res.send(modelConfig);
    } catch (error) {
      logger.error('Error sending models:', error);
      res.status(500).send({ error: error.message });
    }
  }
}

module.exports = { modelController, loadModels, getModelsConfig };
