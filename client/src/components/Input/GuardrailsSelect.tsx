import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocalize } from '~/hooks';
import { useGuardrails } from '~/hooks/useGuardrails';
import { useChatContext } from '~/Providers';
import { CheckMark, useOnClickOutside } from '@librechat/client';
import {
  Listbox,
  ListboxButton,
} from '@headlessui/react';
import { Shield, ChevronDown, Lock } from 'lucide-react';
import { cn } from '~/utils';

interface GuardrailsSelectProps {
  conversation: any;
  setOption: (key: string) => (value: any) => void;
  showAbove?: boolean;
}

export default function GuardrailsSelect({
  conversation,
  setOption,
  showAbove = false,
}: GuardrailsSelectProps) {

  console.log("GuardrailsSelect rendered");
  console.log("Conversation:", conversation);

  const localize = useLocalize();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [buttonPosition, setButtonPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  const { data, isLoading, error } = useGuardrails();
  const guardrails = data?.availableGuardrails || [];
  const defaultConfig = data?.defaultConfig || { defaultEnabled: false, required: [] };
  const isDisabled = defaultConfig.defaultEnabled;

  // Derive selected guardrails from state (no useEffect needed)
  const selectedGuardrails = useMemo(() => {
    if (isDisabled && defaultConfig.required.length > 0) {
      // Show default guardrails when disabled (backend will enforce these)
      return defaultConfig.required;
    } else if (conversation?.guardrails) {
      // Show user-selected guardrails when not disabled
      return conversation.guardrails;
    }
    // No guardrails selected
    return [];
  }, [isDisabled, defaultConfig.required, conversation?.guardrails]);

  // Debug logging
  console.log('[GuardrailsSelect] Debug Info:', {
    data,
    guardrails,
    defaultConfig,
    isDisabled,
    defaultEnabled: defaultConfig.defaultEnabled,
    required: defaultConfig.required,
    selectedGuardrails,
  });

  useOnClickOutside(menuRef, () => setIsOpen(false));

  // Track button position for portal dropdown placement
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    }
  }, [isOpen]);

  const handleGuardrailToggle = (guardrailName: string) => {
    // Prevent toggling when disabled
    if (isDisabled) {
      return;
    }
    
    const currentSelection = conversation?.guardrails || [];
    const newSelection = currentSelection.includes(guardrailName)
      ? currentSelection.filter((name: string) => name !== guardrailName)
      : [...currentSelection, guardrailName];

    console.log('Updating guardrails:', newSelection);
    setOption('guardrails')(newSelection);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Shield className="h-4 w-4" />
        <span>Loading guardrails...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <Shield className="h-4 w-4" />
        <span>Failed to load guardrails</span>
      </div>
    );
  }

  if (guardrails.length === 0) {
    return null;
  }

  // OPTION 1: HIDE COMPLETELY when defaultEnabled is true
  // Uncomment this block to hide the guardrails selector entirely when locked
  // if (isDisabled) {
  //   return null;
  // }

  return (
    <div className="relative w-full">
      <Listbox value={selectedGuardrails} onChange={() => {}}>
        {() => (
          <>
            <ListboxButton
              ref={buttonRef}
              disabled={isDisabled}
              className={cn(
                'relative flex w-full items-center justify-between rounded-md border border-black/10 bg-white py-2 pl-3 pr-3 text-left focus:outline-none dark:border-gray-600 dark:bg-gray-800 sm:text-sm',
                isDisabled 
                  ? 'cursor-not-allowed opacity-60 bg-gray-100 dark:bg-gray-700' 
                  : 'cursor-default'
              )}
              onClick={() => !isDisabled && setIsOpen(!isOpen)}
              title={isDisabled ? 'Guardrails are locked by administrator' : undefined}
            >
              <div className="flex items-center gap-2">
                {isDisabled ? (
                  <Lock className="h-4 w-4 text-orange-500" />
                ) : (
                  <Shield className="h-4 w-4 text-gray-500" />
                )}
                <span className={cn(
                  'text-gray-800 dark:text-white',
                  isDisabled && 'font-medium'
                )}>
                  {selectedGuardrails.length === 0
                    ? 'No guardrails selected'
                    : `${selectedGuardrails.length} guardrail${selectedGuardrails.length > 1 ? 's' : ''} selected`}
                  {isDisabled && (
                    <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                      (Default Enabled)
                    </span>
                  )}
                </span>
              </div>
              {!isDisabled && (
                <ChevronDown
                  className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
                />
              )}
            </ListboxButton>

            {isOpen && !isDisabled &&
              createPortal(
                <div
                  ref={menuRef}
                  className="fixed z-[99999] rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800"
                  style={{
                    top: `${buttonPosition.top + buttonPosition.height + 8}px`,
                    left: `${buttonPosition.left}px`,
                    width: `${buttonPosition.width}px`,
                    maxHeight: '300px',
                    overflow: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                >
                  {guardrails.map((guardrailName: string) => {
                    const isSelected = selectedGuardrails.includes(guardrailName);
                    return (
                      <div
                        key={guardrailName}
                        className={cn(
                          'relative flex cursor-pointer select-none items-center px-3 py-2 text-sm',
                          isSelected
                            ? 'bg-blue-50 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                            : 'text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-700'
                        )}
                        onClick={() => handleGuardrailToggle(guardrailName)}
                      >
                        {/* <Shield className="h-4 w-4 text-gray-500" /> */}
                        <span className="ml-2 font-medium">{guardrailName}</span>
                        {isSelected && (
                          <span className="ml-auto text-blue-600">
                            <CheckMark />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>,
                document.body
              )}
          </>
        )}
      </Listbox>
    </div>
  );
}