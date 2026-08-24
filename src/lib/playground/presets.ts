import { writable } from 'svelte/store'

// A saved playground scene. The share `token` is the source of truth; `label`
// and `thumb` are only for the library UI.
export type Preset = {
  id: string
  label: string
  token: string
  thumb?: string
  createdAt: number
}

const keyFor = (namespace: string) => `pg:presets:${namespace}`

// localStorage-backed store of saved scenes, one namespace per playground.
// SSR-safe, and it starts empty so the server and first client render match.
// Call `refresh()` in onMount to hydrate. `max` caps growth (oldest evicted) so
// a library of thumbnails cannot fill up a user's storage.
export function createPresetStore(namespace: string, max = 30) {
  const key = keyFor(namespace)
  const store = writable<Preset[]>([])

  function read(): Preset[] {
    if (typeof localStorage === 'undefined') return []
    try {
      const arr = JSON.parse(localStorage.getItem(key) || '[]')
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }
  function write(list: Preset[]) {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(list))
      } catch {
        // Quota exceeded or storage disabled. Keep the in-memory list usable.
      }
    }
    store.set(list)
  }

  return {
    subscribe: store.subscribe,
    /** Load from localStorage; call once the component has mounted. */
    refresh() {
      store.set(read())
    },
    /** Prepend a new scene (newest first) and cap the library size. */
    save(entry: { label: string; token: string; thumb?: string }): Preset {
      const preset: Preset = {
        id: `${Date.now().toString(36)}${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        label: entry.label || 'Scene',
        token: entry.token,
        thumb: entry.thumb,
        createdAt: Date.now(),
      }
      write([preset, ...read()].slice(0, max))
      return preset
    },
    remove(id: string) {
      write(read().filter((p) => p.id !== id))
    },
    clear() {
      write([])
    },
  }
}

export type PresetStore = ReturnType<typeof createPresetStore>
