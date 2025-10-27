import { useState, useEffect, useCallback } from 'react';
import { useUser } from './use-user';

export interface UsageMetrics {
  spend: number;
  prompt_tokens: number;
  completion_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
  total_tokens: number;
  successful_requests: number;
  failed_requests: number;
  api_requests: number;
}

export interface UsageBreakdown {
  date: string;
  metrics: UsageMetrics;
  breakdown: {
    mcp_servers: Record<string, unknown>;
    models: Record<string, {
      metrics: UsageMetrics;
      metadata: Record<string, unknown>;
      api_key_breakdown: Record<string, {
        metrics: UsageMetrics;
        metadata: {
          key_alias: string | null;
          team_id: string;
        };
      }>;
    }>;
    model_groups: Record<string, {
      metrics: UsageMetrics;
      metadata: Record<string, unknown>;
      api_key_breakdown: Record<string, {
        metrics: UsageMetrics;
        metadata: {
          key_alias: string | null;
          team_id: string;
        };
      }>;
    }>;
    providers: Record<string, {
      metrics: UsageMetrics;
      metadata: Record<string, unknown>;
      api_key_breakdown: Record<string, {
        metrics: UsageMetrics;
        metadata: {
          key_alias: string | null;
          team_id: string;
        };
      }>;
    }>;
    api_keys: Record<string, {
      metrics: UsageMetrics;
      metadata: {
        key_alias: string | null;
        team_id: string;
      };
    }>;
    entities: Record<string, {
      metrics: UsageMetrics;
      metadata: Record<string, unknown>;
      api_key_breakdown: Record<string, {
        metrics: UsageMetrics;
        metadata: {
          key_alias: string | null;
          team_id: string;
        };
      }>;
    }>;
  };
}

export interface UsageResponse {
  results: UsageBreakdown[];
  metadata: {
    total_spend: number;
    total_prompt_tokens: number;
    total_completion_tokens: number;
    total_tokens: number;
    total_api_requests: number;
    total_successful_requests: number;
    total_failed_requests: number;
    total_cache_read_input_tokens: number;
    total_cache_creation_input_tokens: number;
    page: number;
    total_pages: number;
    has_more: boolean;
  };
}

export const useUsage = (startDate?: string, endDate?: string) => {
  const { userData, token, isAuthenticated } = useUser();
  const [usageData, setUsageData] = useState<UsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async (start?: string, end?: string) => {
    if (!token || !isAuthenticated) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (start) params.append('start_date', start);
      if (end) params.append('end_date', end);

      const url = `/api/usage${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch usage data: ${response.status}`);
      }

      const data: UsageResponse = await response.json();
      setUsageData(data);
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch usage data');
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchUsage(startDate, endDate);
    }
  }, [isAuthenticated, token, startDate, endDate, fetchUsage]);

  return {
    usageData,
    isLoading,
    error,
    refetch: () => fetchUsage(startDate, endDate),
    fetchUsage,
  };
};
