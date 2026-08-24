// Undo history for playground scenes: a stack of scene tokens per playground,
// persisted to localStorage. `touch()` records a change, encoded after a quiet
// period. `undo()` steps back. The stack survives a refresh, so the first undo
// on a fresh load restores the last state you were looking at. SSR-safe.

const LIMIT = 40

export type SceneHistory = {
  /** Record that the scene changed. The token is encoded after a quiet period. */
  touch: (encode: () => string) => void
  /**
   * Step back. Pass the current scene's token; returns the token to restore,
   * or null when there is nothing earlier.
   */
  undo: (current: string) => string | null
}

export function createHistory(page: string, debounceMs = 600): SceneHistory {
  const key = `pg-undo:${page}`
  let stack: string[] = []
  if (typeof localStorage !== 'undefined') {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]')
      if (Array.isArray(parsed))
        stack = parsed
          .filter((t): t is string => typeof t === 'string')
          .slice(-LIMIT)
    } catch {
      // Corrupt entry, start fresh.
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: (() => string) | null = null

  const save = () => {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(stack))
    } catch {
      // Storage full or unavailable. Undo will not survive a refresh.
    }
  }
  const push = (token: string) => {
    if (!token || stack[stack.length - 1] === token) return
    stack.push(token)
    if (stack.length > LIMIT) stack = stack.slice(stack.length - LIMIT)
    save()
  }
  const flush = () => {
    clearTimeout(timer)
    timer = undefined
    if (pending) {
      const encode = pending
      pending = null
      push(encode())
    }
  }

  return {
    touch(encode) {
      if (typeof window === 'undefined') return // SSR runs the reactive pass too
      pending = encode
      clearTimeout(timer)
      timer = setTimeout(flush, debounceMs)
    },
    undo(current) {
      flush()
      push(current) // no-op unless the scene diverged (e.g. fresh load)
      const top = stack[stack.length - 1]
      if (top === undefined) return null
      if (top !== current) return top
      if (stack.length < 2) return null
      stack.pop()
      save()
      return stack[stack.length - 1]
    },
  }
}
