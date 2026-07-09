// Array move used by the drag-to-reorder item/layer lists.

/** A copy of `arr` with the element at `from` moved to index `to`. */
export function moveInArray<T>(arr: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= arr.length ||
    to >= arr.length
  )
    return arr
  const next = arr.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/**
 * Destination index for a row currently at `from`, given the pointer's Y over
 * the list. Counts the row midpoints above the pointer, so the cursor snaps to
 * the nearest slot — including the gaps between rows, which would otherwise
 * cancel the drop. Returns a value in `[0, rows.length - 1]` ready for
 * `moveInArray(arr, from, dropIndexAt(...))`.
 */
export function dropIndexAt(
  rows: HTMLElement[],
  from: number,
  clientY: number
): number {
  let slot = 0
  for (const row of rows) {
    const r = row.getBoundingClientRect()
    if (clientY > r.top + r.height / 2) slot++
  }
  // Removing `from` before re-inserting shifts everything after it down one.
  return from < slot ? slot - 1 : slot
}
