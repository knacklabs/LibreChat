import React from 'react';
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
    });
  } catch {
    return 'Invalid Date';
  }
}

function formatSpend(spend: number | null): string {
  if (spend === null || spend === undefined) return '$0.00';
  return `$${Number(spend).toFixed(2)}`;
}

export default function APIKeysTable({ keys, isLoading, error }: APIKeysTableProps) {

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium">Unable to load API keys</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
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
      <div className="bg-surface-secondary dark:bg-surface-tertiary border border-border-light dark:border-border-medium rounded-lg p-8 text-center">
        <p className="text-text-secondary dark:text-text-secondary">No API keys found</p>
        <p className="text-sm text-text-tertiary dark:text-text-tertiary mt-1">
          Create an API key in LiteLLM to manage your integrations.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border-light dark:border-border-medium">
        <table className="w-full border-collapse bg-background dark:bg-surface-secondary">
          <thead>
            <tr className="border-b border-border-light dark:border-border-medium bg-surface-secondary dark:bg-surface-tertiary">
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                Key Alias
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                Secret Key
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                Created At
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                Expires
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                Spend
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                Updated At
              </th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key, index) => (
              <tr
                key={index}
                className="border-b border-border-light dark:border-border-medium hover:bg-surface-secondary dark:hover:bg-surface-tertiary transition-colors"
              >
                <td className="px-4 py-3 text-sm text-text-primary font-medium">
                  {key.key_alias || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary font-mono">
                  {key.key_name}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {formatDate(key.created_at)}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {formatDate(key.expires)}
                </td>
                <td className="px-4 py-3 text-sm text-text-primary font-semibold">
                  {formatSpend(key.spend)}
                </td>
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {formatDate(key.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

