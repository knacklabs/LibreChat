import React, { useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import type { APIKey } from './types';

interface APIKeysTableProps {
  keys: APIKey[];
  isLoading: boolean;
  error?: string | null;
}

function maskSecret(secret: string | null): string {
  if (!secret) return 'N/A';
  if (secret.length <= 6) return '***';
  return `${secret.substring(0, 3)}...${secret.substring(secret.length - 3)}`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid Date';
  }
}

function formatSpend(spend: number | null): string {
  if (spend === null || spend === undefined) return '$0.00';
  return `$${Number(spend).toFixed(2)}`;
}

interface KeyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: APIKey | null;
}

function KeyDetailModal({ isOpen, onClose, apiKey }: KeyDetailModalProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!apiKey) return null;

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  API Key Details
                </DialogTitle>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key Alias
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-900 break-all">
                      {apiKey.key_alias || 'No alias'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secret Key
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-900 break-all font-mono">
                        {isRevealed ? apiKey.token : maskSecret(apiKey.token)}
                      </div>
                      <button
                        onClick={() => setIsRevealed(!isRevealed)}
                        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                        title={isRevealed ? 'Hide' : 'Show'}
                      >
                        {isRevealed ? (
                          <EyeOff className="w-4 h-4 text-gray-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      {isRevealed && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(apiKey.token || '');
                            alert('Secret key copied to clipboard');
                          }}
                          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ For security, this key is shown only once. Store it safely.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created At
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-900">
                      {formatDate(apiKey.created_at)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expires
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-900">
                      {formatDate(apiKey.expires)}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Close
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

export default function APIKeysTable({ keys, isLoading, error }: APIKeysTableProps) {
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (key: APIKey) => {
    setSelectedKey(key);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Unable to load API keys</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <p className="text-xs text-red-600 mt-2">
              💡 <strong>Troubleshooting:</strong>
              <ul className="mt-1 ml-4 space-y-1 list-disc">
                <li>Ensure LITELLM_URL is set in environment</li>
                <li>Verify LiteLLM server is running</li>
                <li>Check your internet connection</li>
                <li>Try refreshing the page</li>
              </ul>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!keys || keys.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No API keys found</p>
        <p className="text-sm text-gray-500 mt-1">
          Create an API key in LiteLLM to manage your integrations.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Key Alias
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Secret Key
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Created At
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Expires
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Spend
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Updated At
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-gray-900">
                  {key.key_alias || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                  {maskSecret(key.token)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(key.created_at)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(key.expires)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {formatSpend(key.spend)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(key.updated_at)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleViewDetails(key)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <KeyDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        apiKey={selectedKey}
      />
    </>
  );
}

