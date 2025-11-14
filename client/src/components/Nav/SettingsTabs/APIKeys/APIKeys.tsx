import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import APIKeysTable from './APIKeysTable';
import type { APIKey, FetchAPIKeysResponse } from './types';
import { Button } from '@librechat/client';

function APIKeys() {
  const { isAuthenticated,token } = useAuthContext();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAPIKeys = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[APIKeys] Fetching keys from /api/keys/litellm/api-keys');

      const response = await fetch('/api/keys/litellm/api-keys', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      console.log('[APIKeys] Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please log in again');
        } else if (response.status === 404) {
          throw new Error('API Keys endpoint not found - Check server configuration');
        } else if (response.status === 500) {
          throw new Error('Server error - LiteLLM URL may not be configured');
        }
        throw new Error(`Failed to fetch API keys: ${response.statusText}`);
      }

      const data: FetchAPIKeysResponse = await response.json();
      console.log('[APIKeys] Keys received:', data);

      // Extract keys from response - handle different response formats
      const keysArray = data.keys || data.data || [];
      setKeys(keysArray);
      console.log('[APIKeys] Successfully loaded', keysArray.length, 'keys');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred. Please try again.';
      setError(errorMessage);
      console.error('[APIKeys] Error fetching API keys:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('[APIKeys] Component mounted. isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      console.log('[APIKeys] Starting to fetch keys...');
      fetchAPIKeys();
    } else {
      console.log('[APIKeys] User not authenticated, skipping fetch');
    }
  }, [isAuthenticated]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAPIKeys();
  };

  return (
    <div className="flex flex-col gap-4 p-1 text-sm text-text-primary">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">API Keys</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Manage your LiteLLM API keys for integrations and access control.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isLoading || refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <APIKeysTable keys={keys} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}

export default React.memo(APIKeys);

