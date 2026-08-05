'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

import { parseStudentCsv } from '@/modules/student-import/lib/parse-student-csv';
import type { StudentImportFieldsState } from '@/modules/student-import/types/components.types';
import type { ParsedStudentCsv } from '@/modules/student-import/types/student-import.types';

// Local text state for the shared import fields. A dropped or browsed file is
// read into the SAME csv text the paste box shows, so the two intakes are one
// value the admin can still edit, and every change re-parses and reports up.
// Nothing here talks to the network: the host page owns the mutation.
export function useStudentImportFields(
  onChange: (parsed: ParsedStudentCsv) => void,
): StudentImportFieldsState {
  const [csv, setCsvText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setCsv = (text: string) => {
    setCsvText(text);
    onChange(parseStudentCsv(text));
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    const isCsv = /\.csv$/i.test(file.name) || file.type === 'text/csv';
    if (!isCsv) return;
    setCsv(await file.text());
  };

  return {
    csv,
    isDragging,
    inputRef,
    setCsv,
    onBrowse: () => inputRef.current?.click(),
    onFileInput: (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      void readFile(file);
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragging(true);
    },
    onDragLeave: () => setIsDragging(false),
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDragging(false);
      void readFile(event.dataTransfer.files?.[0]);
    },
  };
}
