import { getTranslations } from 'next-intl/server';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { Button } from '@/modules/design-system/components/button';
import { Section } from '@/modules/design-system/components/layout';
import { DialogDemo } from './dialog-demo';
import { DropdownDemo } from './dropdown-demo';
import { PopoverDemo } from './popover-demo';

async function OverlaysSection() {
  const t = await getTranslations('DesignSystem');
  return (
    <Section id="overlays">
      <h2 className="text-2xl font-bold tracking-tight">{t('sectionOverlays')}</h2>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <DialogDemo
          triggerLabel={t('dialogTrigger')}
          title={t('dialogTitle')}
          body={t('dialogBody')}
          cancelLabel={t('dialogCancel')}
          confirmLabel={t('dialogConfirm')}
          closeLabel={t('dialogCloseLabel')}
        />
        <DropdownDemo
          triggerLabel={t('dropdownTrigger')}
          groupLabel={t('tableTest')}
          editLabel={t('dropdownEdit')}
          duplicateLabel={t('dropdownDuplicate')}
          shareLabel={t('dropdownShare')}
          copyLinkLabel={t('tooltipContent')}
          copyLabel={t('popoverCopy')}
          deleteLabel={t('dropdownDelete')}
          checkboxLabel={t('checkboxResults')}
          radioGroupLabel={t('selectLabel')}
          radioMcqLabel={t('radioMcq')}
          radioOpenLabel={t('radioOpen')}
        />
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline">{t('tooltipTrigger')}</Button>} />
          <TooltipContent>{t('tooltipContent')}</TooltipContent>
        </Tooltip>
        <PopoverDemo
          triggerLabel={t('popoverTrigger')}
          title={t('popoverTitle')}
          body={t('popoverBody')}
          copyLabel={t('popoverCopy')}
          inputAriaLabel={t('tooltipContent')}
          linkUrl="https://schooltest.app/t/science-quiz"
        />
      </div>
    </Section>
  );
}

export { OverlaysSection };
