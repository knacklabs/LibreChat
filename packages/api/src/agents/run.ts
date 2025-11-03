import { Run, Providers } from '@librechat/agents';
import { providerEndpointMap, KnownEndpoints } from 'librechat-data-provider';
import type {
  OpenAIClientOptions,
  StandardGraphConfig,
  EventHandler,
  GenericTool,
  GraphEvents,
  IState,
} from '@librechat/agents';
import type { Agent } from 'librechat-data-provider';
import type * as t from '~/types';

const customProviders = new Set([
  Providers.XAI,
  Providers.OLLAMA,
  Providers.DEEPSEEK,
  Providers.OPENROUTER,
]);

export function getReasoningKey(
  provider: Providers,
  llmConfig: t.RunLLMConfig,
  agentEndpoint?: string | null,
): 'reasoning_content' | 'reasoning' {
  let reasoningKey: 'reasoning_content' | 'reasoning' = 'reasoning_content';
  if (provider === Providers.GOOGLE) {
    reasoningKey = 'reasoning';
  } else if (
    llmConfig.configuration?.baseURL?.includes(KnownEndpoints.openrouter) ||
    (agentEndpoint && agentEndpoint.toLowerCase().includes(KnownEndpoints.openrouter))
  ) {
    reasoningKey = 'reasoning';
  } else if (
    (llmConfig as OpenAIClientOptions).useResponsesApi === true &&
    (provider === Providers.OPENAI || provider === Providers.AZURE)
  ) {
    reasoningKey = 'reasoning';
  }
  return reasoningKey;
}

/**
 * Creates a new Run instance with custom handlers and configuration.
 *
 * @param options - The options for creating the Run instance.
 * @param options.agent - The agent for this run.
 * @param options.signal - The signal for this run.
 * @param options.req - The server request.
 * @param options.runId - Optional run ID; otherwise, a new run ID will be generated.
 * @param options.customHandlers - Custom event handlers.
 * @param options.streaming - Whether to use streaming.
 * @param options.streamUsage - Whether to stream usage information.
 * @returns {Promise<Run<IState>>} A promise that resolves to a new Run instance.
 */
export async function createRun({
  runId,
  agent,
  signal,
  customHandlers,
  streaming = true,
  streamUsage = true,
}: {
  agent: Omit<Agent, 'tools'> & { tools?: GenericTool[] };
  signal: AbortSignal;
  runId?: string;
  streaming?: boolean;
  streamUsage?: boolean;
  customHandlers?: Record<GraphEvents, EventHandler>;
}): Promise<Run<IState>> {
  const provider =
    (providerEndpointMap[
      agent.provider as keyof typeof providerEndpointMap
    ] as unknown as Providers) ?? agent.provider;

  // Start with agent.model_parameters first, then override with run-time options
  // This ensures that streaming settings from model_parameters are respected
  // Handle both 'stream' (Anthropic) and 'streaming' (Google/OpenAI) properties
  const modelParams = agent.model_parameters as Record<string, unknown> | undefined;
  const modelStreaming = modelParams?.streaming ?? modelParams?.stream;
  const finalStreaming = modelStreaming !== undefined ? (modelStreaming as boolean) : streaming;
  
  console.log('[createRun] Streaming configuration:', {
    provider: agent.provider,
    modelParametersStreaming: modelParams?.streaming,
    modelParametersStream: modelParams?.stream,
    defaultStreaming: streaming,
    finalStreaming,
  });
  
  const llmConfig: t.RunLLMConfig = Object.assign(
    {},
    agent.model_parameters,
    {
      provider,
      streaming: finalStreaming,
      stream: finalStreaming,  // Set both for compatibility
      streamUsage,
    },
  );

  /** Resolves issues with new OpenAI usage field */
  if (
    customProviders.has(agent.provider) ||
    (agent.provider === Providers.OPENAI && agent.endpoint !== agent.provider)
  ) {
    llmConfig.streamUsage = false;
    llmConfig.usage = true;
  }

  const reasoningKey = getReasoningKey(provider, llmConfig, agent.endpoint);
  const graphConfig: StandardGraphConfig = {
    signal,
    llmConfig,
    reasoningKey,
    tools: agent.tools,
    instructions: agent.instructions,
    additional_instructions: agent.additional_instructions,
    // toolEnd: agent.end_after_tools,
  };

  // TEMPORARY FOR TESTING
  if (agent.provider === Providers.ANTHROPIC || agent.provider === Providers.BEDROCK) {
    graphConfig.streamBuffer = 2000;
  }

  // return Run.create({
  //   runId,
  //   graphConfig,
  //   customHandlers,
  // });

  // temp fix for google guardrails and streaming
  const run = await Run.create({
    runId,
    graphConfig,
    customHandlers,
  });
  
  // Patch Google/VertexAI and Anthropic models to fix invocationParams
  if (run.Graph?.boundModel) {
    const capturedStreaming = finalStreaming;
    const llmConfigAsRecord = llmConfig as unknown as Record<string, unknown>;
    
    console.log('[createRun] Model before patching:', {
      provider,
      'boundModel.streaming': (run.Graph.boundModel as any).streaming,
      'boundModel.stream': (run.Graph.boundModel as any).stream,
      'finalStreaming': capturedStreaming,
    });
    
    // CRITICAL: Set streaming property directly on the model instance
    // This is what LangChain actually checks, not just invocationParams
    if (provider === Providers.GOOGLE || 
        provider === Providers.VERTEXAI || 
        provider === Providers.ANTHROPIC || 
        provider === Providers.BEDROCK) {
      (run.Graph.boundModel as any).streaming = capturedStreaming;
      console.log('[createRun] ✅ Set boundModel.streaming directly to:', capturedStreaming);
    }
    
    // For Google/VertexAI, inject invocationKwargs (for guardrails)
    if ((provider === Providers.GOOGLE || provider === Providers.VERTEXAI) && llmConfigAsRecord.invocationKwargs) {
      (run.Graph.boundModel as any).invocationKwargs = llmConfigAsRecord.invocationKwargs;
      console.log('[createRun] Injected invocationKwargs for Google:', llmConfigAsRecord.invocationKwargs);
    }
    
    // ALSO patch invocationParams as backup
    const originalInvocationParams = run.Graph.boundModel.invocationParams?.bind(run.Graph.boundModel);
    if (originalInvocationParams && 
        (provider === Providers.GOOGLE || 
         provider === Providers.VERTEXAI || 
         provider === Providers.ANTHROPIC || 
         provider === Providers.BEDROCK)) {
      run.Graph.boundModel.invocationParams = function(options: any) {
        const params = originalInvocationParams(options);
        const invocationKwargs = (this as any).invocationKwargs || {};
        const modelKwargs = (this as any).modelKwargs || {};
        
        return {
          ...params,
          ...modelKwargs,
          ...invocationKwargs,
          stream: capturedStreaming,
        };
      };
      
      console.log('[createRun] ✅ Also patched invocationParams for', provider);
    }
  }
  
  return run;
}