// The active search pane the unified §5.4 bar reflects. Owned by
// UnifiedSearchScreen / SearchModeTabs (038); the bar dispatches to the
// matching pane store (schools → school-search, agents → agent-search).
export type UnifiedSearchMode = 'schools' | 'agents';
