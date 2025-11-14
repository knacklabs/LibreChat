import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, OGDialog, OGDialogTemplate } from '@librechat/client';
import { useLocalize } from '~/hooks';
import type { APIKey } from './types';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  apiKey: APIKey | null;
  isDeleting?: boolean;
}

export default function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  apiKey,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  const localize = useLocalize();

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const keyName = apiKey?.key_alias || apiKey?.key_name || 'this API key';

  return (
    <OGDialog open={isOpen} onOpenChange={onOpenChange}>
      <OGDialogTemplate
        className="w-11/12 sm:w-[450px]"
        title="Delete API Key"
        main={
          <div className="space-y-4">
            <div className="flex items-start gap-3">

              <div className="flex-1">
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  Are you sure you want to delete this API key?
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 mb-4">
                  <div className="text-sm text-text-secondary">
                    <strong>Key Name:</strong> {keyName}
                  </div>
                  {apiKey?.expires && (
                    <div className="text-sm text-text-secondary mt-1">
                      <strong>Expires:</strong> {new Date(apiKey.expires).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                    ⚠️ This action cannot be undone
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
        selection={{
          selectHandler: handleConfirm,
          selectClasses: 'bg-red-600 hover:bg-red-700 text-white',
          selectText: isDeleting ? 'Deleting...' : 'Delete Key',
        }}
        buttons={
          <Button onClick={handleCancel} variant="outline" disabled={isDeleting}>
            Cancel
          </Button>
        }
        showCancelButton={false}
      />
    </OGDialog>
  );
}
