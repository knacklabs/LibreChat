import { useCallback, useState } from 'react';
import {
  Button,
  TrashIcon,
  Label,
  OGDialog,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
  OGDialogFooter,
  OGDialogClose,
  TooltipAnchor,
  Spinner,
  useToastContext,
} from '@librechat/client';
import type { FC } from 'react';
import { useDeleteConversationTagMutation } from '~/data-provider';
import { NotificationSeverity } from '~/common';
import { useLocalize } from '~/hooks';

const DeleteBookmarkButton: FC<{
  bookmark: string;
  tabIndex?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}> = ({ bookmark, tabIndex = 0, onFocus, onBlur }) => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const [open, setOpen] = useState(false);

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

  const confirmDelete = useCallback(async () => {
    try {
      await deleteBookmarkMutation.mutateAsync(bookmark);
    } catch (error) {
      // Error is already handled in mutation callbacks
    }
  }, [bookmark, deleteBookmarkMutation]);

  return (
    <>
      <TooltipAnchor
        description={localize('com_ui_delete')}
        render={
          <Button
            variant="ghost"
            aria-label={localize('com_ui_bookmarks_delete')}
            tabIndex={tabIndex}
            onFocus={onFocus}
            onBlur={onBlur}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            className="h-8 w-8 p-0"
          >
            <TrashIcon />
          </Button>
        }
      />
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
    </>
  );
};

export default DeleteBookmarkButton;
