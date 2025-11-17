import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import APIKeysTable from './APIKeysTable';
import CreateAPIKeyDialog from './CreateAPIKeyDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import type { APIKey, FetchAPIKeysResponse } from './types';
import { Button } from '@librechat/client';

function APIKeys() {
  const { isAuthenticated,token } = useAuthContext();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<APIKey | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAPIKeys = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[APIKeys] Fetching keys from /api/keys/litellm/api-keys');

      const response = await fetch('/api/keys/list', {
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

  const handleCreateKey = async (keyData: { key_alias: string; duration: string }) => {
    try {
      console.log('[APIKeys] Creating new API key:', keyData);

      const response = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(keyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        if (response.status === 401) {
          throw new Error('Unauthorized - Please log in again');
        } else if (response.status === 403) {
          throw new Error('Forbidden - Insufficient permissions');
        } else if (response.status === 500) {
          throw new Error('Server error - Please try again later');
        }
        throw new Error(errorData.error?.message || errorData.message || `Failed to create API key: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[APIKeys] API key created successfully:', result);

      // Refresh the keys list to show the new key
      await fetchAPIKeys();

      return result;
    } catch (err) {
      console.error('[APIKeys] Error creating API key:', err);
      throw err;
    }
  };

  const handleDeleteKey = (key: APIKey) => {
    setKeyToDelete(key);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!keyToDelete) return;

    // Use key_alias as the identifier for deletion (required by backend)
    const keyAlias = keyToDelete.key_alias;

    if (!keyAlias) {
      console.error('[APIKeys] Cannot delete key: no key_alias found', keyToDelete);
      alert('Cannot delete this key: missing key alias identifier');
      setIsDeleteDialogOpen(false);
      setKeyToDelete(null);
      return;
    }

    setIsDeleting(true);

    try {
      console.log('[APIKeys] Deleting API key with alias:', keyAlias);

      const response = await fetch(`/api/keys/delete/${encodeURIComponent(keyAlias)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        if (response.status === 400) {
          throw new Error('Invalid request - Key alias may be missing or invalid');
        } else if (response.status === 401) {
          throw new Error('Unauthorized - Please log in again');
        } else if (response.status === 403) {
          throw new Error('Forbidden - Insufficient permissions');
        } else if (response.status === 404) {
          throw new Error('API key not found or already deleted');
        } else if (response.status === 500) {
          throw new Error('Server error - Please try again later');
        }
        throw new Error(errorData.error?.message || errorData.message || `Failed to delete API key: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[APIKeys] API key deleted successfully:', result);

      // Refresh the keys list to remove the deleted key
      await fetchAPIKeys();

      // Close the dialog
      setIsDeleteDialogOpen(false);
      setKeyToDelete(null);
    } catch (err) {
      console.error('[APIKeys] Error deleting API key:', err);
      alert(`Failed to delete API key: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setKeyToDelete(null);
  };

  return (
    <div className="flex flex-col gap-4 p-1 text-sm text-text-primary">
      <div className="flex items-center justify-between mb-4">

        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            variant="default"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isLoading || refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <APIKeysTable keys={keys} isLoading={isLoading} error={error} onDelete={handleDeleteKey} />
      </div>

      <CreateAPIKeyDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateKey}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        apiKey={keyToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default React.memo(APIKeys);

