import type { KeyboardEvent, ReactNode, Ref } from 'react';
import type { LucideIcon } from 'lucide-react';

// Canonical small-enum controls (design-system-and-components §06 "Form controls").
// The SHAPE of the choice picks the control, not the number of options:
//   SelectionCardGroup — options that need a description/price/trailing fact.
//   ChoicePillGroup    — short labels, one line, single OR multi select.
//   SegmentedChoice    — 2–4 mutually exclusive words inside a form (Gender, Term).
//   SelectField        — a long list that must collapse to one row.
//   SelectRow          — the faux app-screen select that opens a sheet/dialog.

export interface RovingRadioOptions {
  values: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  isDisabled?: (value: string) => boolean;
}

export interface RovingRadioItemProps {
  role: 'radio';
  type: 'button';
  'data-value': string;
  'aria-checked': boolean;
  tabIndex: number;
  ref: Ref<HTMLButtonElement>;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onClick: () => void;
}

export interface RovingRadioApi {
  getItemProps: (value: string) => RovingRadioItemProps;
}

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
  trailing?: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

interface ChoiceGroupBase {
  options: readonly ChoiceOption[];
  ariaLabel?: string;
  ariaLabelledBy?: string;
  invalid?: boolean;
  className?: string;
}

export interface SelectionCardGroupProps extends ChoiceGroupBase {
  value: string;
  onValueChange: (value: string) => void;
  size?: 'md' | 'lg';
}

export type ChoicePillSize = 'md' | 'sm';

export type ChoicePillGroupProps = ChoiceGroupBase &
  (
    | { mode?: 'single'; value: string; onValueChange: (value: string) => void; size?: ChoicePillSize }
    | {
        mode: 'multiple';
        value: readonly string[];
        onValueChange: (value: readonly string[]) => void;
        size?: ChoicePillSize;
      }
  );

export interface SegmentedChoiceProps extends ChoiceGroupBase {
  value: string;
  onValueChange: (value: string) => void;
}

export interface FieldShellProps {
  id: string;
  label: string;
  children: ReactNode;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  labelId?: string;
  className?: string;
}

export interface SelectFieldProps {
  id: string;
  label: string;
  options: readonly ChoiceOption[];
  placeholder: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface SelectRowProps {
  id: string;
  label: string;
  placeholder: string;
  value?: string;
  onClick?: () => void;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}
