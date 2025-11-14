import React from 'react';
import { X } from 'lucide-react';
import { useRecoilState } from 'recoil';
import {
  OGDialog,
  OGDialogContent,
  OGDialogHeader,
  OGDialogTitle,
  useMediaQuery,
} from '@librechat/client';
import Parameters from '~/components/SidePanel/Parameters/Panel';
import store from '~/store';
import { useLocalize } from '~/hooks';

export default function ParametersModal() {
  const localize = useLocalize();
  const [open, setOpen] = useRecoilState(store.showParametersModal);
  const [, setHideSidePanel] = useRecoilState(store.hideSidePanel);
  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  const handleClose = () => {
    setOpen(false);
    setHideSidePanel(false);
  };

  return (
    <OGDialog open={open} onOpenChange={setOpen}>
      <OGDialogContent
        className={`${
          isSmallScreen ? 'h-[90vh] w-[95vw] max-w-none' : 'h-[85vh] w-[90vw] max-w-4xl'
        } border-none bg-background p-0 text-foreground`}
        showCloseButton={false}
      >
        <div className="flex items-center justify-between border-b border-border-light p-4 pb-3">
          <OGDialogTitle className="text-lg font-semibold">
            {localize('com_sidepanel_parameters')}
          </OGDialogTitle>
          <button
            type="button"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-text-primary transition-colors hover:bg-surface-hover"
            aria-label="Close"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 touch-pan-y overflow-y-auto p-4">
          <Parameters />
        </div>
      </OGDialogContent>
    </OGDialog>
  );
}
