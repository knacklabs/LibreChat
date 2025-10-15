import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocalize } from '~/hooks';
import { useGuardrails } from '~/hooks/useGuardrails';
import { useChatContext } from '~/Providers';
import { CheckMark, useOnClickOutside } from '@librechat/client';
import {
  Listbox,
  ListboxButton,
} from '@headlessui/react';
import { Shield, ChevronDown } from 'lucide-react';
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
  const [selectedGuardrails, setSelectedGuardrails] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [buttonPosition, setButtonPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  const { data: guardrails = [], isLoading, error } = useGuardrails();

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

  // Initialize selected guardrails
  useEffect(() => {
    if (conversation?.guardrails) {
      setSelectedGuardrails(conversation.guardrails);
    }
  }, [conversation?.guardrails]);

  const handleGuardrailToggle = (guardrailName: string) => {
    setSelectedGuardrails(prev => {
      const newSelection = prev.includes(guardrailName)
        ? prev.filter(name => name !== guardrailName)
        : [...prev, guardrailName];

      console.log('Updating guardrails:', newSelection);
      setOption('guardrails')(newSelection);
      return newSelection;
    });
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

  return (
    <div className="relative w-full">
      <Listbox value={selectedGuardrails} onChange={() => {}}>
        {() => (
          <>
            <ListboxButton
              ref={buttonRef}
              className={cn(
                'relative flex w-full cursor-default items-center justify-between rounded-md border border-black/10 bg-white py-2 pl-3 pr-3 text-left focus:outline-none dark:border-gray-600 dark:bg-gray-800 sm:text-sm'
              )}
              onClick={() => setIsOpen(!isOpen)}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-gray-800 dark:text-white">
                  {selectedGuardrails.length === 0
                    ? 'No guardrails selected'
                    : `${selectedGuardrails.length} guardrail${selectedGuardrails.length > 1 ? 's' : ''} selected`}
                </span>
              </div>
              <ChevronDown
                className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
              />
            </ListboxButton>

            {isOpen &&
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
