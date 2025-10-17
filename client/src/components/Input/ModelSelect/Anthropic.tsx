import { SelectDropDown } from '@librechat/client';
import type { TModelSelectProps } from '~/common';
import SelectDropDownPop from '~/components/Input/ModelSelect/SelectDropDownPop';
import { cn, cardStyle } from '~/utils';
import GuardrailsSelect from '~/components/Input/GuardrailsSelect';

export default function Anthropic({
  conversation,
  setOption,
  models,
  showAbove,
  popover = false,
}: TModelSelectProps) {
  const Menu = popover ? SelectDropDownPop : SelectDropDown;
  return (
    <div className="flex flex-col gap-2">
      <Menu
        value={conversation?.model ?? ''}
        setValue={setOption('model')}
        availableValues={models}
        showAbove={showAbove}
        showLabel={false}
        className={cn(
          cardStyle,
          'z-50 flex h-[40px] w-48 min-w-48 flex-none items-center justify-center px-4 ring-0 hover:cursor-pointer',
        )}
      />
      <GuardrailsSelect conversation={conversation} setOption={setOption} showAbove={showAbove} />
    </div>
  );
}
