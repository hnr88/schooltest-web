import { createLucideIcon } from 'lucide-react';

// The teacher rail's two glyphs, node for node from Teacher Portal v2.dc.html:30
// (a 2×2 grid of rx=2 tiles) and :33 (an r=9 clock with short hands). Lucide's
// LayoutGrid (rx=1) and Clock (r=10, `M12 6v6l4 2`) read visibly heavier at 18px,
// so the design's nodes go through lucide's own factory: the result is a real
// LucideIcon, so NavItem, SidebarNavItem and the stroke/size props are unchanged.
export const TeacherClassesIcon = createLucideIcon('teacher-classes', [
  ['rect', { x: '3', y: '3', width: '7', height: '7', rx: '2', key: 'top-left' }],
  ['rect', { x: '14', y: '3', width: '7', height: '7', rx: '2', key: 'top-right' }],
  ['rect', { x: '3', y: '14', width: '7', height: '7', rx: '2', key: 'bottom-left' }],
  ['rect', { x: '14', y: '14', width: '7', height: '7', rx: '2', key: 'bottom-right' }],
]);

export const TeacherLiveSessionsIcon = createLucideIcon('teacher-live-sessions', [
  ['circle', { cx: '12', cy: '12', r: '9', key: 'face' }],
  ['path', { d: 'M12 8v4l3 2', key: 'hands' }],
]);
