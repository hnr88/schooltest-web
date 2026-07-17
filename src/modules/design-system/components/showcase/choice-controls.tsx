import { getTranslations } from 'next-intl/server';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

async function ChoiceControls() {
  const t = await getTranslations('DesignSystem');
  return (
    <FieldGroup className="mt-6 max-w-md">
      <Field orientation="horizontal">
        <Checkbox id="ds-checkbox" defaultChecked aria-labelledby="ds-checkbox-label" />
        <Label id="ds-checkbox-label">{t('checkboxResults')}</Label>
      </Field>
      <Field orientation="horizontal">
        <Checkbox id="ds-checkbox-card" aria-labelledby="ds-checkbox-card-title" />
        <FieldContent>
          <FieldTitle id="ds-checkbox-card-title">{t('checkboxResults')}</FieldTitle>
          <FieldDescription>{t('fieldEmailHelper')}</FieldDescription>
        </FieldContent>
      </Field>
      <FieldSet>
        <FieldLegend>{t('selectLabel')}</FieldLegend>
        <RadioGroup
          defaultValue="mcq"
          aria-label={t('selectLabel')}
          className="flex flex-wrap gap-4"
        >
          <Field orientation="horizontal">
            <RadioGroupItem value="mcq" aria-labelledby="ds-radio-mcq-label" />
            <Label id="ds-radio-mcq-label">{t('radioMcq')}</Label>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="open" aria-labelledby="ds-radio-open-label" />
            <Label id="ds-radio-open-label">{t('radioOpen')}</Label>
          </Field>
        </RadioGroup>
      </FieldSet>
      <Field orientation="horizontal">
        <Switch
          id="ds-switch-shuffle"
          defaultChecked
          aria-labelledby="ds-switch-shuffle-label"
        />
        <Label id="ds-switch-shuffle-label">{t('switchShuffle')}</Label>
      </Field>
      <Field orientation="horizontal" data-disabled>
        <Switch id="ds-switch-results" disabled aria-labelledby="ds-switch-results-label" />
        <Label id="ds-switch-results-label">{t('switchResults')}</Label>
      </Field>
    </FieldGroup>
  );
}

export { ChoiceControls };
