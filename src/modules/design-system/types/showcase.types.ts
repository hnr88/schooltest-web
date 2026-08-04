import type { ChoiceOption } from '@/modules/design-system/types/choice.types';
import type { SegmentedControlOption } from '@/modules/design-system/types/metrics.types';
import type { UnderlineTabOption } from '@/modules/design-system/types/primitives.types';

export interface AlertDismissDemoProps {
  title: string;
  body: string;
  actionLabel: string;
  dismissLabel: string;
}

export interface ChoiceCardsDemoProps {
  packLabel: string;
  packOptions: readonly ChoiceOption[];
  selectLabel: string;
  selectPlaceholder: string;
  selectOptions: readonly ChoiceOption[];
  selectHelper: string;
  errorText: string;
  countryLabel: string;
  countryPlaceholder: string;
  countryValue: string;
  disabledLabel: string;
}

export interface ChoiceFieldsDemoProps {
  relationshipLabel: string;
  relationshipHelper: string;
  relationshipOptions: readonly ChoiceOption[];
  termLabel: string;
  termOptions: readonly ChoiceOption[];
  subjectsLabel: string;
  subjectsOptions: readonly ChoiceOption[];
  errorText: string;
}

export interface DialogDemoProps {
  triggerLabel: string;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  closeLabel: string;
}

export interface DropdownDemoProps {
  triggerLabel: string;
  editLabel: string;
  duplicateLabel: string;
  shareLabel: string;
  copyLinkLabel: string;
  copyLabel: string;
  deleteLabel: string;
  checkboxLabel: string;
  radioGroupLabel: string;
  radioMcqLabel: string;
  radioOpenLabel: string;
}

export interface FilterRailDemoProps {
  title: string;
  clearLabel: string;
  sectorLabel: string;
  sectorOptions: readonly ChoiceOption[];
  stageLabel: string;
  stageOptions: readonly ChoiceOption[];
  applyLabel: string;
}

export interface PopoverDemoProps {
  triggerLabel: string;
  title: string;
  body: string;
  copyLabel: string;
  inputAriaLabel: string;
  linkUrl: string;
}

export interface PrimitivesDemoProps {
  tabs: readonly UnderlineTabOption[];
  tabsAriaLabel: string;
  resultsLabel: string;
  resultsHint: string;
  shuffleLabel: string;
  shuffleHint: string;
}

export interface SegmentedDemoProps {
  options: SegmentedControlOption[];
  initialValue: string;
  ariaLabel: string;
}

export interface SheetDemoProps {
  triggerLabel: string;
  title: string;
  body: string;
  closeLabel: string;
}

export interface TagDemoProps {
  label: string;
  removeLabel: string;
}
