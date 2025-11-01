import { useQuery } from '@tanstack/react-query';
import { request } from 'librechat-data-provider';

interface Guardrail {
  guardrail_name: string;
}

interface DefaultConfig {
  defaultEnabled: boolean;
  required: string[];
}

interface GuardrailsResponse {
  guardrails: Guardrail[];
  defaultConfig: DefaultConfig;
}

interface GuardrailsData {
  availableGuardrails: string[];
  defaultConfig: DefaultConfig;
}

const fetchGuardrails = async (): Promise<GuardrailsData> => {
  const data = await request.get<GuardrailsResponse>('/api/guardrails');
  console.log("Guardrails data from hook:", data);
  return {
    availableGuardrails: data.guardrails?.map((g: any) => g.guardrail_name) || [],
    defaultConfig: data.defaultConfig || { defaultEnabled: false, required: [] },
  };
};

export const useGuardrails = () => {
  return useQuery({
    queryKey: ['guardrails'],
    queryFn: () => fetchGuardrails(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
