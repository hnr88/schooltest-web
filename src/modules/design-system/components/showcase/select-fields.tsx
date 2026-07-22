import { getTranslations } from 'next-intl/server';

import { Field, FieldLabel } from '@/components/ui/field';
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Select,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectContent, SelectItem } from '@/modules/design-system/components/select-wrappers';

async function SelectFields() {
  const t = await getTranslations('DesignSystem');
  return (
    <>
      <Field>
        <FieldLabel htmlFor="ds-select">{t('selectLabel')}</FieldLabel>
        <Select>
          <SelectTrigger id="ds-select" className="w-full">
            <SelectValue placeholder={t('selectPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{t('selectLabel')}</SelectLabel>
              <SelectItem value="mcq">{t('radioMcq')}</SelectItem>
              <SelectItem value="open">{t('radioOpen')}</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectItem value="disabled" disabled>
                {t('fieldDisabled')}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="ds-native-select">{t('selectLabel')}</FieldLabel>
        <NativeSelect id="ds-native-select" defaultValue="">
          <NativeSelectOption value="" disabled>
            {t('selectPlaceholder')}
          </NativeSelectOption>
          <NativeSelectOptGroup label={t('selectLabel')}>
            <NativeSelectOption value="mcq">{t('radioMcq')}</NativeSelectOption>
            <NativeSelectOption value="open">{t('radioOpen')}</NativeSelectOption>
          </NativeSelectOptGroup>
        </NativeSelect>
      </Field>
    </>
  );
}

export { SelectFields };
