import type { ChangeEvent, DragEvent, RefObject } from 'react';

import type { ParsedStudentCsv } from '@/modules/student-import/types/student-import.types';

export interface StudentImportClassOption {
  documentId: string;
  name: string;
}

// The class selector is optional by construction: Classes (spec §2) creates the
// class in the same submit and omits `classes`, Students (spec §4) passes the
// school's classes and the selector appears.
export interface StudentImportFieldsProps {
  onChange: (parsed: ParsedStudentCsv) => void;
  classes?: readonly StudentImportClassOption[];
  classId?: string;
  onClassChange?: (documentId: string) => void;
  className?: string;
}

export interface CsvDropZoneProps {
  inputRef: RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  onBrowse: () => void;
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}

export interface StudentImportFieldsState {
  csv: string;
  isDragging: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  setCsv: (text: string) => void;
  onBrowse: () => void;
  onFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}
