import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, test, vi } from 'vitest';

import enMessages from '@/i18n/messages/en.json';
import { ExportButtons } from '@/modules/teacher/components/v2/ExportButtons';
import { FilterPills } from '@/modules/teacher/components/v2/FilterPills';
import { PillSearch } from '@/modules/teacher/components/v2/PillSearch';
import { PillSelect } from '@/modules/teacher/components/v2/PillSelect';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { ViewToggle } from '@/modules/teacher/components/v2/ViewToggle';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function render(ui: ReactElement): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  host = container;
  root = createRoot(container);
  act(() => {
    root?.render(
      <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
        {ui}
      </NextIntlClientProvider>,
    );
  });
  return container;
}

function typeInto(element: HTMLInputElement | HTMLSelectElement, value: string): void {
  const proto = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  act(() => {
    setter?.call(element, value);
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  });
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('Teacher v2 kit — controls', () => {
  test('TeacherButton renders the navy primary on the design-system Button', () => {
    const onClick = vi.fn();
    const view = render(<TeacherButton onClick={onClick}>Go</TeacherButton>);
    const button = view.querySelector('button');
    expect(button?.className).toContain('bg-navy-900');
    expect(button?.className).toContain('h-[38px]');
    act(() => button?.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('ExportButtons run their action and stop the row click', () => {
    const onPdf = vi.fn();
    const onLlm = vi.fn();
    const onRow = vi.fn();
    const view = render(
      <div onClick={onRow}>
        <ExportButtons onPdf={onPdf} onLlm={onLlm} pdfTitle="pdf title" />
      </div>,
    );
    const pdf = view.querySelector<HTMLButtonElement>('[data-export="pdf"]');
    const llm = view.querySelector<HTMLButtonElement>('[data-export="llm"]');
    expect(pdf?.textContent).toBe('PDF');
    expect(pdf?.getAttribute('title')).toBe('pdf title');
    expect(llm?.textContent).toBe('LLM');
    act(() => pdf?.click());
    act(() => llm?.click());
    expect(onPdf).toHaveBeenCalledTimes(1);
    expect(onLlm).toHaveBeenCalledTimes(1);
    expect(onRow).not.toHaveBeenCalled();
  });

  test('PillSearch and PillSelect report the new value', () => {
    const onSearch = vi.fn();
    const onSelect = vi.fn();
    const view = render(
      <div>
        <PillSearch value="" onValueChange={onSearch} placeholder="Search" label="Search label" />
        <PillSelect
          label="Sort"
          value="a"
          onValueChange={onSelect}
          options={[
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ]}
        />
      </div>,
    );
    const input = view.querySelector('input');
    const select = view.querySelector('select');
    expect(input?.getAttribute('aria-label')).toBe('Search label');
    expect(select?.getAttribute('aria-label')).toBe('Sort');
    if (input) typeInto(input, 'read');
    if (select) typeInto(select, 'b');
    expect(onSearch).toHaveBeenCalledWith('read');
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  test('ViewToggle marks the active view and forwards root attributes', () => {
    const onChange = vi.fn();
    const view = render(
      <ViewToggle value="list" onValueChange={onChange} data-slot="directory-layout-toggle" />,
    );
    const group = view.querySelector('[data-slot="directory-layout-toggle"]');
    expect(group?.getAttribute('role')).toBe('group');
    const tiles = view.querySelector<HTMLButtonElement>('button[aria-label="Tiles"]');
    const list = view.querySelector<HTMLButtonElement>('button[aria-label="List"]');
    expect(list?.getAttribute('aria-pressed')).toBe('true');
    expect(tiles?.getAttribute('aria-pressed')).toBe('false');
    act(() => tiles?.click());
    expect(onChange).toHaveBeenCalledWith('tiles');
  });

  test('FilterPills: pressed state, counts and selection', () => {
    const onChange = vi.fn();
    const view = render(
      <FilterPills
        label="Filter"
        value="all"
        onValueChange={onChange}
        options={[
          { value: 'all', label: 'All' },
          { value: 'held', label: 'Held', count: 2 },
        ]}
      />,
    );
    const buttons = view.querySelectorAll<HTMLButtonElement>('[data-slot="filter-pills"] button');
    expect(buttons[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(buttons[0]?.className).toContain('bg-navy-900');
    expect(buttons[1]?.textContent).toBe('Held2');
    act(() => buttons[1]?.click());
    expect(onChange).toHaveBeenCalledWith('held');
  });
});
