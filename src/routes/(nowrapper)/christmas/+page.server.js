import { json } from './christmas';

/** @type {import('./$types').PageLoad} */
export function load() {
	return {
		...json
	};
}
