import { useEffect, useState } from 'react';
import type { TConversationTag } from 'librechat-data-provider';
import { BookmarkEditDialog } from '~/components/Bookmarks';
import {
  Button,
  Label,
  OGDialog,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
  OGDialogFooter,
  OGDialogClose,
  Spinner,
  useToastContext,
} from '@librechat/client';
import { useDeleteConversationTagMutation } from '~/data-provider';
import { NotificationSeverity } from '~/common';
import { useLocalize } from '~/hooks';

export const EditBookmarkDialog = ({
  bookmark,
  onClose,
}: {
  bookmark: TConversationTag;
  onClose: () => void;
}) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      onClose();
    }
  }, [open, onClose]);

  return (
    <BookmarkEditDialog
      context="BookmarkNav - EditDialog"
      bookmark={bookmark}
      open={open}
      setOpen={setOpen}
    />
  );
};

export const DeleteBookmarkDialog = ({
  bookmark,
  onClose,
}: {
  bookmark: string;
  onClose: () => void;
}) => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [open, setOpen] = useState(true);

  const deleteBookmarkMutation = useDeleteConversationTagMutation({
    onSuccess: () => {
      showToast({
        message: localize('com_ui_bookmarks_delete_success'),
      });
      setOpen(false);
    },
    onError: () => {
      showToast({
        message: localize('com_ui_bookmarks_delete_error'),
        severity: NotificationSeverity.ERROR,
      });
      setOpen(false);
    },
  });

  useEffect(() => {
    if (!open) {
      onClose();
    }
  }, [open, onClose]);

  const confirmDelete = async () => {
    try {
      await deleteBookmarkMutation.mutateAsync(bookmark);
    } catch (error) {
      // Error is already handled in mutation callbacks
    }
  };

  return (
    <OGDialog open={open} onOpenChange={setOpen}>
      <OGDialogContent
        showCloseButton={false}
        className="w-11/12 max-w-lg border-none bg-background text-foreground"
      >
        <OGDialogHeader>
          <OGDialogTitle>{localize('com_ui_bookmarks_delete')}</OGDialogTitle>
        </OGDialogHeader>
        <div className="px-0 py-2">
          <Label className="text-left text-sm font-medium">
            {localize('com_ui_bookmark_delete_confirm')} {bookmark}
          </Label>
        </div>
        <OGDialogFooter>
          <div className="flex h-auto gap-3 max-sm:w-full max-sm:flex-col sm:flex-row">
            <OGDialogClose asChild>
              <Button variant="outline">{localize('com_ui_cancel')}</Button>
            </OGDialogClose>
            <Button
              onClick={confirmDelete}
              disabled={deleteBookmarkMutation.isLoading}
              className="bg-red-700 text-white hover:bg-red-800 disabled:opacity-80 dark:bg-red-600 dark:hover:bg-red-800"
            >
              {deleteBookmarkMutation.isLoading ? (
                <Spinner className="size-4 text-white" />
              ) : (
                localize('com_ui_delete')
              )}
            </Button>
          </div>
        </OGDialogFooter>
      </OGDialogContent>
    </OGDialog>
  );
};

