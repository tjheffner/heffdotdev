<script lang="ts">
  // A "Saved" control Section: stores the current scene into localStorage and
  // lists what's been saved, each row loadable / copyable / deletable. Playground-
  // agnostic — the page supplies how to encode, apply, thumbnail, and label a
  // scene; the shared token contract is all this needs.
  import { onMount } from 'svelte';
  import Section from './Section.svelte';
  import type { Preset, PresetStore } from '$lib/playground/presets';

  export let store: PresetStore;
  export let encode: () => string; // current scene → share token
  export let apply: (token: string) => void; // load a token back into the scene
  export let snapshot: (() => string | null) | undefined = undefined; // thumbnail dataURL
  export let savePng: (() => void) | undefined = undefined; // canvas export, if the playground has one
  export let label = 'Scene'; // short name for the scene being saved
  export let param = 's'; // URL query key the page reads on load
  export let open = false;

  $: presets = $store as Preset[];

  let copiedId = '';
  let currentCopied = false;
  let copyTimer: ReturnType<typeof setTimeout>;

  const longLink = (token: string) =>
    `${window.location.origin}${window.location.pathname}?${param}=${token}`;

  // Ask the server to store the scene under a short code (/p/<code>); fall back
  // to the self-contained long link if the shortener is unavailable.
  async function shortLink(token: string): Promise<string> {
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, page: window.location.pathname })
      });
      if (!res.ok) return longLink(token);
      const { code } = await res.json();
      return code ? `${window.location.origin}/p/${code}` : longLink(token);
    } catch {
      return longLink(token);
    }
  }

  // Copy the (eventual) short link. Uses a promise-backed ClipboardItem so the
  // async round-trip keeps the user gesture on Safari; falls back to writeText.
  async function copyShare(token: string) {
    const pending = shortLink(token);
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const item = new ClipboardItem({
          'text/plain': pending.then((u) => new Blob([u], { type: 'text/plain' }))
        });
        await navigator.clipboard.write([item]);
        return;
      }
    } catch {
      // Fall through to writeText.
    }
    try {
      await navigator.clipboard.writeText(await pending);
    } catch {
      // Clipboard unavailable.
    }
  }

  function saveCurrent() {
    store.save({ label, token: encode(), thumb: snapshot?.() ?? undefined });
  }
  async function copyLink(p: Preset) {
    await copyShare(p.token);
    copiedId = p.id;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copiedId = ''), 1500);
  }
  async function copyCurrent() {
    await copyShare(encode());
    currentCopied = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (currentCopied = false), 1500);
  }

  onMount(() => store.refresh());
</script>

<Section title={`Saved (${presets.length})`} {open}>
  <div class="scene-actions">
    <button class="btn" on:click={saveCurrent}>Save</button>
    {#if savePng}
      <button class="btn" on:click={savePng}>Save PNG</button>
    {/if}
    <button class="btn" on:click={copyCurrent}>{currentCopied ? 'Copied' : 'Copy link'}</button>
  </div>

  {#if !presets.length}
    <p class="hint">
      No saved scenes yet. “Save” keeps this scene in your browser so you can jump back to it.
    </p>
  {:else}
    <p class="hint">Saved in this browser. Click a scene to load it.</p>
    <ul class="saved-list">
      {#each presets as p (p.id)}
        <li class="saved">
          <button class="saved-load" on:click={() => apply(p.token)} title={`Load “${p.label}”`}>
            {#if p.thumb}
              <img class="saved-thumb" src={p.thumb} alt="" />
            {:else}
              <span class="saved-thumb placeholder"></span>
            {/if}
            <span class="saved-name">{p.label}</span>
          </button>
          <button
            class="saved-act"
            title="Copy link"
            aria-label={`Copy link to ${p.label}`}
            on:click|stopPropagation={() => copyLink(p)}
          >{copiedId === p.id ? '✓' : 'Link'}</button>
          <button
            class="saved-act del"
            title="Delete"
            aria-label={`Delete ${p.label}`}
            on:click|stopPropagation={() => store.remove(p.id)}
          >×</button>
        </li>
      {/each}
    </ul>
  {/if}

  <!-- Optional extra content (e.g. a code snippet) supplied by the playground. -->
  <slot />
</Section>

<style>
  .saved-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .saved {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    border: 1px solid var(--pg-line);
    border-radius: 6px;
    background: #14141a;
    padding: 0.3rem;
  }
  .saved-load {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font: inherit;
    color: var(--pg-text);
    background: transparent;
    border: none;
    border-radius: 4px;
    padding: 0.1rem;
    cursor: pointer;
    text-align: left;
  }
  .saved-load:hover .saved-name {
    color: var(--pg-accent);
  }
  .saved-load:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 1px;
  }
  .saved-thumb {
    flex: none;
    width: 34px;
    height: 34px;
    border-radius: 4px;
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: #0a0a12;
  }
  .saved-thumb.placeholder {
    background: linear-gradient(135deg, #2a2a31, #14141a);
  }
  .saved-name {
    font-size: 0.7rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 120ms ease;
  }
  .saved-act {
    flex: none;
    font: inherit;
    font-size: 0.6rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--pg-dim);
    background: transparent;
    border: 1px solid var(--pg-line);
    border-radius: 4px;
    padding: 0.25rem 0.4rem;
    cursor: pointer;
  }
  .saved-act:hover {
    color: var(--pg-text);
    border-color: var(--pg-dim);
  }
  .saved-act:focus-visible {
    outline: 2px solid var(--pg-accent);
    outline-offset: 1px;
  }
  .saved-act.del {
    width: 24px;
    padding: 0.25rem 0;
    text-align: center;
    font-size: 0.85rem;
  }
  .saved-act.del:hover {
    color: #e05555;
    border-color: #e05555;
  }
</style>
