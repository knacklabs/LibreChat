import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocalize } from '~/hooks';
import { useGuardrails } from '~/hooks/useGuardrails';
import { useChatContext } from '~/Providers';
import { CheckMark, useOnClickOutside } from '@librechat/client';
import {
  Listbox,
  ListboxButton,
  Label,
  ListboxOptions,
  ListboxOption,
  Transition,
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

  console.log("GuardrailsSelect rendered"); // <-- Add this
  console.log("Conversation:", conversation); // <-- Check if conversation is defined

  const localize = useLocalize();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGuardrails, setSelectedGuardrails] = useState<string[]>([]);
  const menuRef = React.useRef(null);

  console.log("Selected Guardrails:", selectedGuardrails); // <-- Check if selectedGuardrails is defined
  
  useOnClickOutside(menuRef, () => setIsOpen(false), () => {
    console.log("Menu clicked outside"); // <-- Add this
  });

  const { data: guardrails = [], isLoading, error } = useGuardrails();

  console.log("Guardrails data from hook:", guardrails); // <-- Add this
  console.log("isLoading:", isLoading, "error:", error); // <-- Check loading/error state

  // Initialize selected guardrails from conversation
  useEffect(() => {
    if (conversation?.guardrails) {
      setSelectedGuardrails(conversation.guardrails);
      console.log("Selected Guardrails:", selectedGuardrails); // <-- Check if selectedGuardrails is defined

    }
  }, [conversation?.guardrails]);

  const handleGuardrailToggle = (guardrailName: string) => {
    console.log('handleGuardrailToggle called with:', guardrailName);
    setSelectedGuardrails(prev => {
      const newSelection = prev.includes(guardrailName)
        ? prev.filter(name => name !== guardrailName)
        : [...prev, guardrailName];
      
      console.log('Calling setOption with guardrails:', newSelection);
      setOption('guardrails')(newSelection);
      return newSelection;
    });
  };

  

  if (isLoading) {
    console.log("Loading guardrails..."); // <-- Check if guardrails is loading
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Shield className="h-4 w-4" />
        <span>Loading guardrails...</span>
      </div>
    );
  }

  if (error) {
    console.log("Error loading guardrails:", error); // <-- Check if error is defined
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <Shield className="h-4 w-4" />
        <span>Failed to load guardrails</span>
      </div>
    );
  }

  if (guardrails.length === 0) {
    console.log("Guardrails:", guardrails); // <-- Check if guardrails is defined
    return null;
  }

  return (
    <div className="relative w-full">
      <Listbox value={selectedGuardrails} onChange={() => {}}>
        {() => (
          <>
            <ListboxButton
              className={cn(
                'relative flex w-full cursor-default flex-col rounded-md border border-black/10 bg-white py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-0 focus:ring-offset-0 dark:border-gray-600 dark:border-white/20 dark:bg-gray-800 sm:text-sm'
              )}
              onClick={() => {
                setIsOpen(!isOpen);
                console.log("ListboxButton clicked");
                console.log("isOpen:", isOpen);
              }}
              
            >
              <Label className="block text-xs text-gray-700 dark:text-gray-500">
                Guardrails
              </Label>
              <span className="inline-flex w-full truncate">
                <span className="flex h-6 items-center gap-1 truncate text-sm text-gray-800 dark:text-white">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span>
                    {selectedGuardrails.length === 0
                      ? 'No guardrails selected'
                      : `${selectedGuardrails.length} guardrail${selectedGuardrails.length > 1 ? 's' : ''} selected`
                    }
                  </span>
                </span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-gray-400',
                    isOpen && 'rotate-180'
                  )}
                />
              </span>
            </ListboxButton>
            
            {isOpen && createPortal(
              <div 
                ref={menuRef}
                className="fixed z-[99999] rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800"
                style={{ 
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 99999,
                  width: '300px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
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
                      onClick={() => {
                        console.log('Option clicked:', guardrailName);
                        handleGuardrailToggle(guardrailName);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{guardrailName}</span>
                        {isSelected && (
                          <span className="ml-auto text-blue-600">
                            <CheckMark />
                          </span>
                        )}
                      </div>
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
