import { writable } from 'svelte/store';

// Bumped by PlaygroundShell whenever the control layer is hidden. Each <Section>
// watches it and closes, so re-opening the controls always starts from a clean,
// all-collapsed state. A module singleton (rather than context) because the
// Sections are slotted content and don't share the shell's context tree — and
// only one playground is ever mounted at a time.
export const collapseSignal = writable(0);
export const collapseMenus = () => collapseSignal.update((n) => n + 1);
