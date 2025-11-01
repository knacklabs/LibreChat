import { Dispatcher, ProxyAgent } from 'undici';
import { AnthropicClientOptions } from '@librechat/agents';
import { anthropicSettings, removeNullishValues } from 'librechat-data-provider';
import type { AnthropicLLMConfigResult, AnthropicConfigOptions } from '~/types/anthropic';
import { checkPromptCacheSupport, getClaudeHeaders, configureReasoning } from './helpers';

/**
 * Generates configuration options for creating an Anthropic language model (LLM) instance.
 * @param apiKey - The API key for authentication with Anthropic.
 * @param options={} - Additional options for configuring the LLM.
 * @returns Configuration options for creating an Anthropic LLM instance, with null and undefined values removed.
 */
function getLLMConfig(
  apiKey?: string,
  options: AnthropicConfigOptions = {} as AnthropicConfigOptions,
): AnthropicLLMConfigResult {
  const systemOptions = {
    thinking: options.modelOptions?.thinking ?? anthropicSettings.thinking.default,
    promptCache: options.modelOptions?.promptCache ?? anthropicSettings.promptCache.default,
    thinkingBudget:
      options.modelOptions?.thinkingBudget ?? anthropicSettings.thinkingBudget.default,
  };

  /** Couldn't figure out a way to still loop through the object while deleting the overlapping keys when porting this
   * over from javascript, so for now they are being deleted manually until a better way presents itself.
   */
  if (options.modelOptions) {
    delete options.modelOptions.thinking;
    delete options.modelOptions.promptCache;
    delete options.modelOptions.thinkingBudget;
  } else {
    throw new Error('No modelOptions provided');
  }

  const defaultOptions = {
    model: anthropicSettings.model.default,
    maxOutputTokens: anthropicSettings.maxOutputTokens.default,
    stream: true,
  };

  const mergedOptions = Object.assign(defaultOptions, options.modelOptions);

  // Extract guardrails from mergedOptions or options.modelOptions
  // Guardrails should be in mergedOptions because:
  // 1. endpointOption.model_parameters.guardrails → extractLibreChatParams preserves it (not a LibreChat key)
  // 2. modelOptions.guardrails → getOptions → options.modelOptions.guardrails → mergedOptions.guardrails
  console.log('[getLLMConfig] Checking for guardrails:', {
    hasGuardrailsInMergedOptions: !!(mergedOptions as Record<string, unknown>).guardrails,
    hasGuardrailsInModelOptions: !!(options.modelOptions as Record<string, unknown>)?.guardrails,
    mergedOptionsGuardrails: (mergedOptions as Record<string, unknown>).guardrails,
    modelOptionsGuardrails: (options.modelOptions as Record<string, unknown>)?.guardrails,
    mergedOptionsKeys: Object.keys(mergedOptions),
    modelOptionsKeys: Object.keys(options.modelOptions || {}),
  });
  
  const guardrails = 
    (mergedOptions as Record<string, unknown>).guardrails ?? 
    (options.modelOptions as Record<string, unknown>)?.guardrails;
  
  if (guardrails) {
    delete (mergedOptions as Record<string, unknown>).guardrails;
    if (options.modelOptions) {
      delete (options.modelOptions as Record<string, unknown>).guardrails;
    }
    console.log('[getLLMConfig] Guardrails found and will be placed in invocationKwargs:', guardrails);
  } else {
    console.log('[getLLMConfig] No guardrails found in mergedOptions or modelOptions');
  }

  let requestOptions: AnthropicClientOptions & { stream?: boolean } = {
    apiKey,
    model: mergedOptions.model,
    stream: mergedOptions.stream,
    temperature: mergedOptions.temperature,
    stopSequences: mergedOptions.stop,
    maxTokens:
      mergedOptions.maxOutputTokens || anthropicSettings.maxOutputTokens.reset(mergedOptions.model),
    clientOptions: {},
    invocationKwargs: {
      metadata: {
        user_id: mergedOptions.user,
      },
    },
  };
  if (guardrails) {
    // Place guardrails in invocationKwargs so they're included in the actual API request
    requestOptions.invocationKwargs = {
      ...(requestOptions.invocationKwargs || {}),
      guardrails,
    };
    console.log('[getLLMConfig] Guardrails placed in invocationKwargs:', guardrails);
  }
  
  console.log('[getLLMConfig] requestOptions structure:', {
    hasClientOptions: !!requestOptions.clientOptions,
    clientOptionsKeys: requestOptions.clientOptions ? Object.keys(requestOptions.clientOptions) : [],
    hasInvocationKwargs: !!requestOptions.invocationKwargs,
    invocationKwargsKeys: requestOptions.invocationKwargs ? Object.keys(requestOptions.invocationKwargs) : [],
    invocationKwargsGuardrails: (requestOptions.invocationKwargs as Record<string, unknown>)?.guardrails,
  });

  requestOptions = configureReasoning(requestOptions, systemOptions);

  if (!/claude-3[-.]7/.test(mergedOptions.model)) {
    requestOptions.topP = mergedOptions.topP;
    requestOptions.topK = mergedOptions.topK;
  } else if (requestOptions.thinking == null) {
    requestOptions.topP = mergedOptions.topP;
    requestOptions.topK = mergedOptions.topK;
  }

  const supportsCacheControl =
    systemOptions.promptCache === true && checkPromptCacheSupport(requestOptions.model ?? '');
  const headers = getClaudeHeaders(requestOptions.model ?? '', supportsCacheControl);
  if (headers && requestOptions.clientOptions) {
    requestOptions.clientOptions.defaultHeaders = headers;
  }

  if (options.proxy && requestOptions.clientOptions) {
    const proxyAgent = new ProxyAgent(options.proxy);
    requestOptions.clientOptions.fetchOptions = {
      dispatcher: proxyAgent,
    };
  }

  if (options.reverseProxyUrl && requestOptions.clientOptions) {
    requestOptions.clientOptions.baseURL = options.reverseProxyUrl;
    requestOptions.anthropicApiUrl = options.reverseProxyUrl;
  }

  const tools = [];

  if (mergedOptions.web_search) {
    tools.push({
      type: 'web_search_20250305',
      name: 'web_search',
    });
  }

  const llmConfig = removeNullishValues(
    requestOptions as Record<string, unknown>,
  ) as AnthropicClientOptions & { clientOptions?: { fetchOptions?: { dispatcher: Dispatcher } } };
  
  const invocationKwargs = (llmConfig as AnthropicClientOptions).invocationKwargs;
  console.log('[getLLMConfig] Final llmConfig structure:', {
    hasClientOptions: !!llmConfig.clientOptions,
    clientOptionsKeys: llmConfig.clientOptions ? Object.keys(llmConfig.clientOptions) : [],
    hasInvocationKwargs: !!invocationKwargs,
    invocationKwargsKeys: invocationKwargs ? Object.keys(invocationKwargs) : [],
    invocationKwargsGuardrails: (invocationKwargs as Record<string, unknown>)?.guardrails,
    topLevelKeys: Object.keys(llmConfig),
  });
  
  return {
    tools,
    llmConfig,
  };
}

export { getLLMConfig };
