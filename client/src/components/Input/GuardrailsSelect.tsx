import React, { useMemo } from 'react';
import { useLocalize } from '~/hooks';
import { useGuardrails } from '~/hooks/useGuardrails';
import { useChatContext } from '~/Providers';
import { CheckMark } from '@librechat/client';
import { Shield, Lock } from 'lucide-react';
import * as Ariakit from '@ariakit/react';
import { cn } from '~/utils';

interface GuardrailsSelectProps {
  conversation: any;
  setOption: (key: string) => (value: any) => void;
}

export default function GuardrailsSelect({
  conversation,
  setOption,
}: GuardrailsSelectProps) {
  const localize = useLocalize();
  const { data, isLoading, error } = useGuardrails();
  const guardrails = data?.availableGuardrails || [];
  const defaultConfig = data?.defaultConfig || { defaultEnabled: false, required: [] };
  const isDisabled = defaultConfig.defaultEnabled;

  // Derive selected guardrails from state
  const selectedGuardrails = useMemo(() => {
    if (isDisabled && defaultConfig.required.length > 0) {
      return defaultConfig.required;
    } else if (conversation?.guardrails) {
      return conversation.guardrails;
    }
    return [];
  }, [isDisabled, defaultConfig.required, conversation?.guardrails]);

  const handleGuardrailToggle = (guardrailName: string) => {
    if (isDisabled) {
      return;
    }
    
    const currentSelection = conversation?.guardrails || [];
    const newSelection = currentSelection.includes(guardrailName)
      ? currentSelection.filter((name: string) => name !== guardrailName)
      : [...currentSelection, guardrailName];

    setOption('guardrails')(newSelection);
  };

  if (isLoading || error || guardrails.length === 0) {
    return null;
  }

  const getDisplayText = () => {
    if (selectedGuardrails.length === 0) {
      return localize('com_ui_guardrails_select') || localize('com_ui_select') || 'Select...';
    }
    if (selectedGuardrails.length === 1) {
      return selectedGuardrails[0];
    }
    return localize('com_ui_x_selected', { 0: selectedGuardrails.length }) || `${selectedGuardrails.length} selected`;
  };

  return (
    <div className="w-full">
      <Ariakit.Combobox
        disabled={isDisabled}
        className={cn(
          'h-10 w-full rounded-lg border border-border-medium bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder-text-secondary',
          'transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          isDisabled && 'cursor-not-allowed opacity-60 bg-gray-100 dark:bg-gray-700'
        )}
        placeholder={getDisplayText()}
        readOnly
        title={isDisabled ? localize('com_ui_guardrails_locked_by_admin') || 'Guardrails are locked by administrator' : undefined}
      />
      
      {!isDisabled && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border-medium bg-surface-secondary">
          {guardrails.map((guardrailName: string) => {
            const isSelected = selectedGuardrails.includes(guardrailName);
            return (
              <button
                key={guardrailName}
                type="button"
                onClick={() => handleGuardrailToggle(guardrailName)}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center gap-3 px-3 py-2 text-sm text-left transition-colors',
                  isSelected
                    ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
                    : 'text-text-primary hover:bg-surface-hover dark:hover:bg-gray-700'
                )}
              >
                <Shield className="h-4 w-4 flex-shrink-0 text-text-secondary" />
                <span className="flex-grow font-medium">{guardrailName}</span>
                {isSelected && (
                  <span className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                    <CheckMark />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

        <div className="mt-2 rounded-lg border border-border-medium bg-orange-50 dark:bg-orange-900/20 p-3">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-grow text-xs text-orange-800 dark:text-orange-200">
              <div className="font-semibold mb-1">{localize('com_ui_guardrails_default_enabled') || 'Default Enabled'}</div>
              <div className="flex flex-wrap gap-1">
                {selectedGuardrails.map((name: string) => (
                  <span key={name} className="inline-block rounded bg-orange-200 dark:bg-orange-700 px-2 py-1">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}