const { ErrorTypes, EModelEndpoint, mapModelToAzureConfig } = require('librechat-data-provider');
const {
  isEnabled,
  resolveHeaders,
  isUserProvided,
  getOpenAIConfig,
  getAzureCredentials,
  createHandleLLMNewToken,
} = require('@librechat/api');
const { getUserKeyValues, checkUserKeyExpiry } = require('~/server/services/UserService');
const OpenAIClient = require('~/app/clients/OpenAIClient');

const initializeClient = async ({
  req,
  res,
  endpointOption,
  optionsOnly,
  overrideEndpoint,
  overrideModel,
}) => {
  const appConfig = req.config;
  const {
    PROXY,
    OPENAI_API_KEY,
    AZURE_API_KEY,
    OPENAI_REVERSE_PROXY,
    AZURE_OPENAI_BASEURL,
    OPENAI_SUMMARIZE,
    DEBUG_OPENAI,
    LITELLM_URL
  } = process.env;
  const { key: expiresAt } = req.body;
  const modelName = overrideModel ?? req.body.model;
  const endpoint = overrideEndpoint ?? req.body.endpoint;
  const contextStrategy = isEnabled(OPENAI_SUMMARIZE) ? 'summarize' : null;

  const credentials = {
    [EModelEndpoint.openAI]: OPENAI_API_KEY,
    [EModelEndpoint.azureOpenAI]: AZURE_API_KEY,
  };
  // Check if either OpenAI or Azure API key is "openid" to use LibreChat authorization header
  const shouldUseOpenIdAuth = credentials[endpoint] === 'openid';

  const baseURLOptions = {
    [EModelEndpoint.openAI]: OPENAI_REVERSE_PROXY,
    [EModelEndpoint.azureOpenAI]: AZURE_OPENAI_BASEURL,
  };

  const userProvidesKey = isUserProvided(credentials[endpoint]);
  const userProvidesURL = isUserProvided(baseURLOptions[endpoint]);

  let userValues = null;
  if (expiresAt && (userProvidesKey || userProvidesURL)) {
    checkUserKeyExpiry(expiresAt, endpoint);
    userValues = await getUserKeyValues({ userId: req.user.id, name: endpoint });
  }

  let apiKey = userProvidesKey ? userValues?.apiKey : credentials[endpoint];
  let baseURL = userProvidesURL ? userValues?.baseURL : baseURLOptions[endpoint];

  // Use LITELLM_URL as fallback if no endpoint-specific base URL is available
  if (!baseURL && LITELLM_URL) {
    baseURL = LITELLM_URL;
  }
  // Use authorization header as API key when OpenID auth is enabled
  if (shouldUseOpenIdAuth) {
    apiKey = req.headers.authorization;
  }

  let clientOptions = {
    contextStrategy,
    proxy: PROXY ?? null,
    debug: isEnabled(DEBUG_OPENAI),
    reverseProxyUrl: baseURL ? baseURL : null,
    authHeader: shouldUseOpenIdAuth ? req.headers.authorization : null,
    ...endpointOption,
  };

  const isAzureOpenAI = endpoint === EModelEndpoint.azureOpenAI;
  /** @type {false | TAzureConfig} */
  const azureConfig = isAzureOpenAI && appConfig.endpoints?.[EModelEndpoint.azureOpenAI];
  let serverless = false;
  if (isAzureOpenAI && azureConfig) {
    const { modelGroupMap, groupMap } = azureConfig;
    const {
      azureOptions,
      baseURL,
      headers = {},
      serverless: _serverless,
    } = mapModelToAzureConfig({
      modelName,
      modelGroupMap,
      groupMap,
    });
    serverless = _serverless;

    clientOptions.reverseProxyUrl = baseURL ?? clientOptions.reverseProxyUrl;
    clientOptions.headers = resolveHeaders({
      headers: { ...headers, ...(clientOptions.headers ?? {}) },
      user: req.user,
    });

    clientOptions.titleConvo = azureConfig.titleConvo;
    clientOptions.titleModel = azureConfig.titleModel;

    const azureRate = modelName.includes('gpt-4') ? 30 : 17;
    clientOptions.streamRate = azureConfig.streamRate ?? azureRate;

    clientOptions.titleMethod = azureConfig.titleMethod ?? 'completion';

    const groupName = modelGroupMap[modelName].group;
    clientOptions.addParams = azureConfig.groupMap[groupName].addParams;
    clientOptions.dropParams = azureConfig.groupMap[groupName].dropParams;
    clientOptions.forcePrompt = azureConfig.groupMap[groupName].forcePrompt;

    // Don't override apiKey if using OpenID auth
    if (!shouldUseOpenIdAuth) {
      apiKey = azureOptions.azureOpenAIApiKey;
    }
    clientOptions.azure = !serverless && azureOptions;
    if (serverless === true) {
      clientOptions.defaultQuery = azureOptions.azureOpenAIApiVersion
        ? { 'api-version': azureOptions.azureOpenAIApiVersion }
        : undefined;
      clientOptions.headers['api-key'] = apiKey;
    }
  } else if (isAzureOpenAI) {
    // Don't override apiKey if using OpenID auth
    if (!shouldUseOpenIdAuth) {
      clientOptions.azure = userProvidesKey ? JSON.parse(userValues.apiKey) : getAzureCredentials();
      apiKey = clientOptions.azure.azureOpenAIApiKey;
    } else {
      clientOptions.azure = getAzureCredentials();
    }
  }

  /** @type {undefined | TBaseEndpoint} */
  const openAIConfig = appConfig.endpoints?.[EModelEndpoint.openAI];

  if (!isAzureOpenAI && openAIConfig) {
    clientOptions.streamRate = openAIConfig.streamRate;
    clientOptions.titleModel = openAIConfig.titleModel;
  }

  const allConfig = appConfig.endpoints?.all;
  if (allConfig) {
    clientOptions.streamRate = allConfig.streamRate;
  }

  if (userProvidesKey && !shouldUseOpenIdAuth && !apiKey) {
    throw new Error(
      JSON.stringify({
        type: ErrorTypes.NO_USER_KEY,
      }),
    );
  }

  if (!shouldUseOpenIdAuth && !apiKey) {
    throw new Error(`${endpoint} API Key not provided.`);
  }

  if (shouldUseOpenIdAuth && !req.headers.authorization) {
    throw new Error(`${endpoint} Authorization header not provided for OpenID authentication.`);
  }

  if (optionsOnly) {
    const modelOptions = endpointOption?.model_parameters ?? {};
    modelOptions.model = modelName;
    clientOptions = Object.assign({ modelOptions }, clientOptions);
    clientOptions.modelOptions.user = req.user.id;
    const options = getOpenAIConfig(apiKey, clientOptions);
    if (options != null && serverless === true) {
      options.useLegacyContent = true;
    }
    const streamRate = clientOptions.streamRate;
    if (!streamRate) {
      return options;
    }
    options.llmConfig.callbacks = [
      {
        handleLLMNewToken: createHandleLLMNewToken(streamRate),
      },
    ];
    return options;
  }

  const client = new OpenAIClient(apiKey, Object.assign({ req, res }, clientOptions));
  return {
    client,
    openAIApiKey: apiKey,
  };
};

module.exports = initializeClient;
