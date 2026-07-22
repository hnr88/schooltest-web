import { SearchIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';

import { Section } from '@/modules/design-system/components/layout';
import { ChoiceControls } from './choice-controls';
import { SelectFields } from './select-fields';

async function FormsSection() {
  const t = await getTranslations('DesignSystem');
  return (
    <Section id="forms">
      <h2 className="text-2xl font-bold tracking-tight">{t('sectionForms')}</h2>
      <FieldGroup className="mt-6 max-w-md">
        <Field>
          <FieldLabel htmlFor="ds-email">{t('fieldEmail')}</FieldLabel>
          <Input id="ds-email" type="email" placeholder={t('fieldEmailPlaceholder')} />
          <FieldDescription>{t('fieldEmailHelper')}</FieldDescription>
        </Field>
        <Field data-invalid>
          <FieldLabel htmlFor="ds-email-error">{t('fieldEmail')}</FieldLabel>
          <Input id="ds-email-error" type="email" defaultValue="demo@schooltest" aria-invalid />
          <FieldError>{t('fieldEmailError')}</FieldError>
        </Field>
        <Field data-disabled>
          <FieldLabel htmlFor="ds-disabled">{t('fieldDisabled')}</FieldLabel>
          <Input id="ds-disabled" disabled placeholder={t('fieldEmailPlaceholder')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="ds-instructions">{t('fieldInstructions')}</FieldLabel>
          <Textarea id="ds-instructions" placeholder={t('fieldInstructionsPlaceholder')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="ds-search">{t('fieldSearchPlaceholder')}</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput id="ds-search" placeholder={t('fieldSearchPlaceholder')} />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label={t('fieldSearchPlaceholder')}>
                <SearchIcon aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="ds-notes">{t('fieldInstructions')}</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="block-start">
              <InputGroupText>{t('fieldInstructions')}</InputGroupText>
            </InputGroupAddon>
            <InputGroupTextarea id="ds-notes" placeholder={t('fieldInstructionsPlaceholder')} />
          </InputGroup>
        </Field>
        <SelectFields />
        <FieldSeparator />
      </FieldGroup>
      <ChoiceControls />
    </Section>
  );
}

export { FormsSection };
