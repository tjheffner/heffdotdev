import type { Action } from 'svelte/action'

/**
 * Opens any `.zoom-trigger` image (produced by rehypeZoomImages) inside a
 * native modal <dialog>. showModal() promotes the dialog to the top layer, so
 * it sits above the sticky header instead of being clipped by it, traps focus,
 * and closes on Escape. We also lock background scroll while it's open.
 *
 * Applied to the content container, e.g. `<div class="prose" use:lightbox>`.
 */
export const lightbox: Action<HTMLElement> = (node) => {
  const dialog = document.createElement('dialog')
  dialog.className = 'lightbox'
  dialog.setAttribute('aria-label', 'Enlarged image')

  const img = document.createElement('img')
  dialog.append(img)
  document.body.append(dialog)

  function open(source: HTMLImageElement) {
    img.src = source.currentSrc || source.src
    img.alt = source.alt
    dialog.showModal()
    document.documentElement.classList.add('lightbox-open')
  }

  function onClose() {
    document.documentElement.classList.remove('lightbox-open')
    // release the decoded full-res bitmap once it's hidden
    img.removeAttribute('src')
  }

  function onTriggerClick(event: MouseEvent) {
    const trigger = (event.target as HTMLElement).closest('.zoom-trigger')
    if (!trigger || !node.contains(trigger)) return
    const source = trigger.querySelector('img')
    if (!source) return
    event.preventDefault()
    open(source)
  }

  // click anywhere in the dialog (backdrop area or the image) dismisses it
  const onDialogClick = () => dialog.close()

  node.addEventListener('click', onTriggerClick)
  dialog.addEventListener('click', onDialogClick)
  dialog.addEventListener('close', onClose)

  return {
    destroy() {
      node.removeEventListener('click', onTriggerClick)
      document.documentElement.classList.remove('lightbox-open')
      dialog.remove()
    },
  }
}
