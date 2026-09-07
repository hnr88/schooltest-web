/**
 * Presentation constants of the roster table (task 33). NO CUT AND NO STATE
 * DERIVATION LIVES HERE — scores, deltas and bands arrive on the ResultView;
 * the table prints them and re-derives nothing.
 */

/**
 * 56px rows: the whole row is the drill-down target, so it clears the 44x44px
 * minimum (WCAG 2.2 AA 2.5.8) on the short axis too. `relative` is what the row
 * link's full-row overlay positions against.
 */
export const STUDENTS_TABLE_ROW_CLASS =
  'relative h-14 border-border transition-colors duration-200 ease-out hover:bg-surface-inset focus-within:bg-surface-inset motion-reduce:transition-none';

/** The first data column carries the left divider under the Student header. */
export const STUDENTS_TABLE_GROUP_EDGE_CLASS = 'border-l border-border';
