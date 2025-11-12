import React from 'react';
import { X } from 'lucide-react';
import { useRecoilState } from 'recoil';
import Parameters from '~/components/SidePanel/Parameters/Panel';
import store from '~/store';

export default function ParametersPanelContent() {
  const [, setOpen] = useRecoilState(store.showParametersDrawer);
  const [, setHideSidePanel] = useRecoilState(store.hideSidePanel);

  const handleClose = () => {
    setOpen(false);
    setHideSidePanel(false);
  };

  return (
    <div className="flex h-full flex-col border-l border-border-light bg-background">
      <div className="flex items-center justify-between border-b border-border-light p-3">
        <h2 className="text-sm font-semibold">Parameters</h2>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface-hover text-text-primary transition-colors"
          aria-label="Close"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <Parameters />
      </div>
    </div>
  );
}

