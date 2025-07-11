import type { Handle } from '@sveltejs/kit'
import type { HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event, {
    preload: ({ type }) => {
      return type === 'font' || type === 'js' || type === 'css'
    },
  })
  return response
}

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	return {
    error,
    event,
		message,
    status	
  };
};
