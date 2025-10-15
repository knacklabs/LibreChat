import { useQuery } from '@tanstack/react-query';
import { useGetEndpointsQuery } from '~/data-provider';

interface Guardrail {
  guardrail_name: string;
}

interface GuardrailsResponse {
  guardrails: Guardrail[];
}

const fetchGuardrails = async (): Promise<Guardrail[]> => {
  const response = await fetch('/api/guardrails');
  if (!response.ok) {
    throw new Error('Failed to fetch guardrails');
  }
  const data = await response.json();
  console.log("Guardrails data from hook:", data);
  return data.guardrails?.map((g: any) => g.guardrail_name) || [];

};

export const useGuardrails = () => {
  return useQuery({
    queryKey: ['guardrails'],
    queryFn: () => fetchGuardrails(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
