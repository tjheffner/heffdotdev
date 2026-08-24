import { writable } from 'svelte/store'

// Bumped by PlaygroundShell whenever the control layer is hidden. Each <Section>
// watches it and closes, so reopening the controls starts fully collapsed.
// A module singleton, not context: Sections are slotted content and do not
// share the shell's context tree, and only one playground is mounted at a time.
export const collapseSignal = writable(0)
export const collapseMenus = () => collapseSignal.update((n) => n + 1)
