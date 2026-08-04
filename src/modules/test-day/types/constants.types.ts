export interface RunSheetListSection {
  key: 'before' | 'start' | 'during' | 'trouble' | 'after';
  items: readonly string[];
}
