import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import {
  CheckCircle,
  XCircle,
  Cpu,
  DollarSign,
  Activity,
  Minimize2,
  Code,
  Copy,
  Check,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import type { TDialogProps } from '~/common';

interface ModelData {
  model_name: string;
  litellm_params: Record<string, any>;
  model_info: Record<string, any>;
}

const formatCost = (cost: number | null | undefined) => {
  if (cost === null || cost === undefined) return 'N/A';
  // If cost is very small (per token), show per 1M tokens
  if (cost < 0.01) {
    return `$${(cost * 1000000).toFixed(2)} / 1M tokens`;
  }
  return `$${cost.toFixed(6)}`;
};

const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat().format(num);
};

const CapabilityBadge = ({ label, supported }: { label: string; supported: boolean | null }) => (
  <div
    className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${
      supported
        ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'
        : 'border-gray-200 bg-gray-50 text-gray-500 opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }`}
  >
    {supported ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
    {label}
  </div>
);

const CopyConfigButton = ({ item }: { item: ModelData }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const config = {
      model_display_name: item.model_name,
      model: item.model_name,
      base_url: 'https://admin.knacklabs.ai',
      api_key: 'dummy-key',
      provider: 'generic-chat-completion-api',
      max_tokens: item.model_info?.max_tokens || item.model_info?.max_output_tokens,
    };

    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        copied
          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied Config!' : 'Copy droid config'}
    </button>
  );
};

export default function ModelConfigDialog({ open, onOpenChange }: TDialogProps) {
  const { token } = useAuthContext();
  const [data, setData] = useState<ModelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = data.filter((item) =>
    item.model_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const fetchConfig = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetch('/api/model-config', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        if (json.data) {
          setData(json.data);
        } else {
          setData([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch model info: ' + err.message);
        setLoading(false);
      });
  }, [token]);

  useEffect(() => {
    if (open) {
      fetchConfig();
    }
  }, [open, fetchConfig]);

  return (
    <Transition appear show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onOpenChange}>
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/80"
            aria-hidden="true"
          />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-5xl transform overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 text-left align-middle shadow-xl transition-all dark:border-gray-800 dark:bg-gray-900">
                <DialogTitle
                  as="div"
                  className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100">
                      <Cpu className="h-5 w-5 text-blue-500" />
                      Model Configuration
                    </h3>
                    {/* Mobile close button shown only on small screens if needed, but we have one main close button. 
                        Let's keep the layout clean. */}
                  </div>

                  <div className="flex flex-1 items-center gap-4 md:justify-end">
                    <div className="relative w-full md:max-w-xs">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={fetchConfig}
                      disabled={loading}
                      className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500 focus:outline-none disabled:opacity-50 dark:hover:bg-gray-800"
                      title="Refresh Configuration"
                    >
                      <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500 focus:outline-none dark:hover:bg-gray-800"
                      onClick={() => onOpenChange(false)}
                    >
                      <span className="sr-only">Close</span>
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </DialogTitle>

                <div className="custom-scrollbar mt-2 max-h-[70vh] overflow-y-auto pr-2">
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
                      <p>Loading model configuration...</p>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                      <p>{error}</p>
                    </div>
                  )}

                  {!loading && !error && filteredData.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                      <p>
                        {data.length === 0
                          ? 'No model configuration data found.'
                          : 'No models match your search.'}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                    {filteredData.map((item, index) => (
                      <div
                        key={index}
                        className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/50 dark:hover:border-blue-800"
                      >
                        {/* Header Section */}
                        <div className="border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5 dark:border-gray-800 dark:from-gray-800 dark:to-gray-800/50">
                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                              <div className="mb-1 flex items-center gap-3">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                  {item.model_name}
                                </h4>
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/30">
                                  {item.litellm_params?.custom_llm_provider ||
                                    item.model_info?.litellm_provider ||
                                    'Unknown Provider'}
                                </span>
                              </div>
                              <div className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                ID: {item.model_info?.id}
                              </div>
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex flex-col items-end">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                  Context
                                </span>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {formatNumber(item.model_info?.max_input_tokens)} In /{' '}
                                  {formatNumber(item.model_info?.max_output_tokens)} Out
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content Grid */}
                        <div className="p-5">
                          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            {/* Pricing Section */}
                            <div>
                              <h5 className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
                                <DollarSign className="h-4 w-4 text-green-500" />
                                Pricing
                              </h5>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">
                                    Input Cost
                                  </span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {formatCost(item.model_info?.input_cost_per_token)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">
                                    Output Cost
                                  </span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {formatCost(item.model_info?.output_cost_per_token)}
                                  </span>
                                </div>
                                {item.model_info?.cache_read_input_token_cost && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Cache Read
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {formatCost(item.model_info?.cache_read_input_token_cost)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Capabilities Section */}
                            <div>
                              <h5 className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
                                <Activity className="h-4 w-4 text-orange-500" />
                                Capabilities
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                <CapabilityBadge
                                  label="Vision"
                                  supported={item.model_info?.supports_vision}
                                />
                                <CapabilityBadge
                                  label="Function Calling"
                                  supported={item.model_info?.supports_function_calling}
                                />
                                <CapabilityBadge
                                  label="Tool Choice"
                                  supported={item.model_info?.supports_tool_choice}
                                />
                                <CapabilityBadge
                                  label="System Messages"
                                  supported={item.model_info?.supports_system_messages}
                                />
                                <CapabilityBadge
                                  label="Response Schema"
                                  supported={item.model_info?.supports_response_schema}
                                />
                                <CapabilityBadge
                                  label="Streaming"
                                  supported={item.model_info?.supports_native_streaming}
                                />
                                <CapabilityBadge
                                  label="Reasoning"
                                  supported={item.model_info?.supports_reasoning}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Collapsible JSON Details */}
                          <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() =>
                                  setExpandedModel(
                                    expandedModel === item.model_name ? null : item.model_name,
                                  )
                                }
                                className="flex items-center gap-2 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 focus:outline-none dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {expandedModel === item.model_name ? (
                                  <>
                                    <Minimize2 className="h-3 w-3" /> Hide Technical Details
                                  </>
                                ) : (
                                  <>
                                    <Code className="h-3 w-3" /> Show Technical Details
                                  </>
                                )}
                              </button>

                              <CopyConfigButton item={item} />
                            </div>

                            {expandedModel === item.model_name && (
                              <div className="mt-4 grid grid-cols-1 gap-4 duration-200 animate-in fade-in slide-in-from-top-2 lg:grid-cols-2">
                                <div>
                                  <span className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    LiteLLM Params
                                  </span>
                                  <pre className="custom-scrollbar h-48 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-[10px] leading-relaxed text-gray-600 dark:border-gray-700 dark:bg-black/30 dark:text-gray-300">
                                    {JSON.stringify(item.litellm_params, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <span className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    Model Info
                                  </span>
                                  <pre className="custom-scrollbar h-48 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-[10px] leading-relaxed text-gray-600 dark:border-gray-700 dark:bg-black/30 dark:text-gray-300">
                                    {JSON.stringify(item.model_info, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                    onClick={() => onOpenChange(false)}
                  >
                    Close Configuration
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
