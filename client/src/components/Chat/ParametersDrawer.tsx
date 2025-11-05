import React from 'react';
import { X } from 'lucide-react';
import { useRecoilState } from 'recoil';
import Parameters from '~/components/SidePanel/Parameters/Panel';
import { Button } from '@librechat/client';
import store from '~/store';

export default function ParametersDrawer() {
  const [open, setOpen] = useRecoilState(store.showParametersDrawer);
  const [, setHideSidePanel] = useRecoilState(store.hideSidePanel);

  if (!open) return null;

  const handleClose = () => {
    setOpen(false);
    setHideSidePanel(false);
  };

  return (
    <aside
      className="fixed right-0 top-0 z-[60] flex h-full w-[340px] sm:w-[352px] flex-col border-l border-border-light bg-background shadow-xl"
      role="dialog"
      aria-label="Parameters"
    >
      <div className="flex items-center justify-between border-b border-border-light p-3">
        <h2 className="text-sm font-semibold">Parameters</h2>
        <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Close" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <Parameters />
      </div>
    </aside>
  );
}


