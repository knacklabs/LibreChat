import type { FC } from 'react';
import { Settings2 } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { useRecoilState } from 'recoil';
import store from '~/store';
import { useLocalize } from '~/hooks';

const ParametersMenu: FC = () => {
  const localize = useLocalize();
  const [showParametersModal, setShowParametersModal] = useRecoilState(store.showParametersModal);

  const handleClick = () => {
    setShowParametersModal(!showParametersModal);
  };

  return (
    <TooltipAnchor
      id="parameters-button"
      aria-label={localize('com_sidepanel_parameters')}
      description={localize('com_sidepanel_parameters')}
      tabIndex={0}
      role="button"
      data-testid="parameters-button"
      onClick={handleClick}
      className={`inline-flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-border-light bg-transparent text-text-primary transition-all ease-in-out hover:bg-surface-tertiary disabled:pointer-events-none disabled:opacity-50 ${
        showParametersModal ? 'bg-surface-tertiary' : ''
      }`}
    >
      <Settings2 size={16} aria-label="Parameters Icon" />
    </TooltipAnchor>
  );
};

export default ParametersMenu;

