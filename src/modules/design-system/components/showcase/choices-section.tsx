import { getTranslations } from 'next-intl/server';

import { Section } from '@/modules/design-system/components/layout';
import { ChoiceCardsDemo } from './choice-cards-demo';
import { ChoiceFieldsDemo } from './choice-fields-demo';

async function ChoicesSection() {
  const t = await getTranslations('DesignSystem');
  return (
    <Section id="choices" className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">{t('sectionChoices')}</h2>
        <p className="max-w-2xl text-body-sm text-muted-foreground">{t('choicesIntro')}</p>
      </div>
      <ChoiceFieldsDemo
        relationshipLabel={t('choiceRelationshipLabel')}
        relationshipHelper={t('choiceRelationshipHelper')}
        relationshipOptions={[
          { value: 'parent', label: t('choiceRelationshipParent') },
          { value: 'guardian', label: t('choiceRelationshipGuardian') },
          { value: 'other', label: t('choiceRelationshipOther') },
        ]}
        termLabel={t('choiceTermLabel')}
        termOptions={[
          { value: 't1', label: t('choiceTermOne') },
          { value: 't2', label: t('choiceTermTwo') },
          { value: 't3', label: t('choiceTermThree'), disabled: true },
        ]}
        subjectsLabel={t('choiceSubjectsLabel')}
        subjectsOptions={[
          { value: 'math', label: t('primitiveSubjectMath') },
          { value: 'english', label: t('primitiveSubjectEnglish') },
          { value: 'science', label: t('choiceSubjectScience') },
        ]}
        errorText={t('choiceErrorRequired')}
      />
      <ChoiceCardsDemo
        packLabel={t('choicePackLabel')}
        packOptions={[
          {
            value: 'family',
            label: t('choicePackFamily'),
            description: t('choicePackFamilyNote'),
            trailing: t('choicePackFamilyPrice'),
          },
          {
            value: 'single',
            label: t('choicePackSingle'),
            description: t('choicePackSingleNote'),
            trailing: t('choicePackSinglePrice'),
          },
          {
            value: 'school',
            label: t('choicePackSchool'),
            description: t('choicePackSchoolNote'),
            disabled: true,
          },
        ]}
        selectLabel={t('selectLabel')}
        selectPlaceholder={t('selectPlaceholder')}
        selectOptions={[
          { value: 'mcq', label: t('radioMcq') },
          { value: 'open', label: t('radioOpen') },
        ]}
        selectHelper={t('fieldEmailHelper')}
        errorText={t('choiceErrorRequired')}
        countryLabel={t('choiceCountryLabel')}
        countryPlaceholder={t('choiceCountryPlaceholder')}
        countryValue={t('choiceCountryValue')}
        disabledLabel={t('fieldDisabled')}
      />
    </Section>
  );
}

export { ChoicesSection };
