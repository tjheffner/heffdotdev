import grayMatter from 'gray-matter';
import { remark } from 'remark';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';

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


/**
 * All pages built from github issue should contain this data at minimum
 *
 * @param {import('./types').GithubIssue} issue
 * @returns {import('./types').BaseContentItem}
 */
export function baseIssueContent(issue) {
	const src = issue.body;
	const { content, data } = grayMatter(src);
	let title = data.title ?? issue.title;
	let slug;
	if (data.slug) {
		slug = data.slug;
	} else {
		slug = slugify(title);
	}

	let description = data.description ?? content.trim().split('\n')[0];
	// extract plain text from markdown
	description = remark()
		.use(remarkParse)
		.use(remarkStringify)
		.processSync(description)
		.toString();
	description = description.replace(/\n/g, ' ');
	// strip html
	description = description.replace(/<[^>]*>?/gm, '');
	// strip markdown
	description = description.replace(/[[\]]/gm, '');
	// strip markdown
	description = description.replace(/[[\]]/gm, '');

	return {
		frontmatter: data,
		issueNumber: issue.number,
		slug: slug,
		title,
		description,
		content,
		ghMetadata: {
			issueUrl: issue.html_url,
			commentsUrl: issue.comments_url,
			title: issue.title,
			created_at: issue.created_at,
			updated_at: issue.updated_at,
			reactions: issue.reactions
		}
	}
}
