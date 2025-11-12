import {
  OGDialog,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
  OGDialogClose,
  Button,
} from '@librechat/client';
import { useLocalize } from '~/hooks';
import FilesPanel from '~/components/SidePanel/Files/Panel';

interface FileLibraryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FileLibraryDialog = ({ isOpen, onOpenChange }: FileLibraryDialogProps) => {
  const localize = useLocalize();

  return (
    <OGDialog open={isOpen} onOpenChange={onOpenChange}>
      <OGDialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <OGDialogHeader className="border-b border-border-light pb-4">
          <OGDialogTitle>{localize('com_files_select_from_library')}</OGDialogTitle>
        </OGDialogHeader>

        {/* Reuse existing FilesPanel component with selection indicators */}
        <div className="flex-1 overflow-hidden px-6 py-4">
          <FilesPanel showSelection={true} />
        </div>

        <div className="border-t border-border-light px-6 py-4 flex justify-end">
          <OGDialogClose asChild>
            <Button variant="outline">{localize('com_ui_close')}</Button>
          </OGDialogClose>
        </div>
      </OGDialogContent>
    </OGDialog>
  );
};

