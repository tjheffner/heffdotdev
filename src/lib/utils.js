/**
 * @param {string} text
 * @returns {string}
 */
export function readingTime(text) {
	let minutes = Math.ceil(text.trim().split(' ').length / 225);
	return minutes > 1 ? `${minutes} minutes` : `${minutes} minute`;
}

/**
 * @param {string | number} text
 * @returns {string}
 */
export function slugify(text) {
    return text
        .toString()                 // Cast to string (optional)
        .normalize('NFKD')          // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
        .toLowerCase()              // Convert the string to lowercase letters
        .trim()                     // Remove whitespace from both sides of a string (optional)
        .replace(/\s+/g, '-')       // Replace spaces with hyphen
		.replace(/[^\w-]+/g, '')   // Remove all non-word chars
		.replace(/--+/g, '-')     // Replace multiple hyphen with single hyphen
		.replace(/(^-|-$)/g, ''); // Remove leading or trailing hyphen
}
