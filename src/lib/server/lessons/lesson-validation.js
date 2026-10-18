import { createSlug } from '../setup.js';

/**
 * @typedef {object} LessonInput
 * @property {number} phaseId
 * @property {string | null} [video_url]
 * @property {string} title
 * @property {string} description
 * @property {string} content
 * @property {number} [displayOrder]
 */

/** @param {number} id @param {string} [label] */
export function validateId(id, label = 'Lesson ID') {
	if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
		throw new Error(`${label} must be a positive PostgreSQL integer.`);
	}
	return id;
}

/** @param {string} value @param {string} label */
export function requiredText(value, label) {
	if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`);
	return value.trim();
}

/** @param {string} value */
export function validateLessonTitle(value) {
	const title = requiredText(value, 'Title');
	if (title.length > 225) throw new Error('Title must be 225 characters or fewer.');
	if (!createSlug(title)) throw new Error('Title must include at least one English letter or number for its URL.');
	return title;
}

/** @param {number} value */
export function validateDisplayOrder(value) {
	if (!Number.isInteger(value) || value < 0 || value > 2147483647) {
		throw new Error('Display order must be a nonnegative PostgreSQL integer.');
	}
	return value;
}

/** @param {string | null | undefined} value */
export function validateVideoUrl(value) {
	if (value === undefined || value === null || value === '') return null;
	if (typeof value !== 'string') throw new Error('Video URL must be text.');
	const videoUrl = value.trim();
	if (!videoUrl) return null;
	try {
		const url = new URL(videoUrl);
		if (/^https?:\/\//i.test(videoUrl) && (url.protocol === 'https:' || url.protocol === 'http:')) return videoUrl;
	} catch {
		// Report malformed URLs and unsupported protocols consistently.
	}
	throw new Error('Video URL must be a complete HTTP or HTTPS URL.');
}

/** @param {LessonInput} input */
export function validateLesson(input) {
	const title = validateLessonTitle(input.title);
	return {
		phaseId: validateId(input.phaseId, 'Phase ID'),
		title,
		description: requiredText(input.description, 'Overview'),
		content: requiredText(input.content, 'Content'),
		video_url: validateVideoUrl(input.video_url),
		displayOrder: validateDisplayOrder(input.displayOrder ?? 0),
		slug: createSlug(title)
	};
}
