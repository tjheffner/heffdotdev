import type { LayoutLoadEvent } from './$types'

export const load = ({ url }: LayoutLoadEvent): { currentRoute: string } => {
  const currentRoute = url.pathname

  return {
    currentRoute,
  }
}
