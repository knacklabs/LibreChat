import React, { useState } from 'react';
import { Button, OGDialog, OGDialogTemplate } from '@librechat/client';
import { Input } from '~/components/ui/input';
import { useLocalize } from '~/hooks';
import { Copy, Check } from 'lucide-react';

interface CreateAPIKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (keyData: { key_alias: string; duration: string }) => Promise<any>;
}

const DURATION_OPTIONS = [
  { value: '1d', label: '1 Day' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '365d', label: '1 Year' },
  { value: 'never', label: 'Never Expires' },
];

export default function CreateAPIKeyDialog({
  isOpen,
  onOpenChange,
  onSubmit,
}: CreateAPIKeyDialogProps) {
  const localize = useLocalize();
  const [keyAlias, setKeyAlias] = useState('');
  const [duration, setDuration] = useState('30d');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyAlias.trim()) {
      setError('Key name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit({
        key_alias: keyAlias.trim(),
        duration: duration === 'never' ? '' : duration,
      });

      // Store the generated key data to show it
      setGeneratedKey(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyKey = async () => {
    if (generatedKey?.key) {
      await navigator.clipboard.writeText(generatedKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDone = () => {
    // Reset form and close dialog
    setKeyAlias('');
    setDuration('30d');
    setError(null);
    setGeneratedKey(null);
    setCopied(false);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setKeyAlias('');
      setDuration('30d');
      setError(null);
      setGeneratedKey(null);
      setCopied(false);
    }
    onOpenChange(open);
  };

  return (
    <OGDialog open={isOpen} onOpenChange={handleOpenChange}>
      <OGDialogTemplate
        className="w-11/12 sm:w-[550px]"
        title={generatedKey ? "API Key Created Successfully" : "Create API Key"}
        main={
          generatedKey ? (
            // Success view - show the generated key
            <div className="space-y-4">


              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  API Key
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={generatedKey.key || ''}
                    readOnly
                    className="font-mono text-sm bg-gray-50 dark:bg-gray-800"
                  />
                  <Button
                    onClick={handleCopyKey}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Key Alias
                </label>
                <Input
                  type="text"
                  value={generatedKey.key_alias || ''}
                  readOnly
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>

              {generatedKey.expires && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Expires
                  </label>
                  <Input
                    type="text"
                    value={new Date(generatedKey.expires).toLocaleString()}
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-start">
                  <div className="text-yellow-600 mr-2">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Important Security Notice
                    </p>
                    <p className="text-sm text-yellow-700">
                      This API key will only be shown once. Please copy and save it securely.
                      You will not be able to retrieve this key again after closing this dialog.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Form view - show the creation form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="keyAlias" className="block text-sm font-medium text-text-primary mb-2">
                  Key Name *
                </label>
                <Input
                  id="keyAlias"
                  type="text"
                  value={keyAlias}
                  onChange={(e) => setKeyAlias(e.target.value)}
                  placeholder="Enter a name for your API key"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-text-primary mb-2">
                  Expiration
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800"
                >
                  {DURATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                  {error}
                </div>
              )}
            </form>
          )
        }
        selection={{
          selectHandler: generatedKey ? handleDone : handleSubmit,
          selectClasses: generatedKey
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white',
          selectText: generatedKey
            ? 'Done'
            : (isSubmitting ? 'Creating...' : 'Create Key'),
        }}
        showCancelButton={!generatedKey}
      />
    </OGDialog>
  );
}
