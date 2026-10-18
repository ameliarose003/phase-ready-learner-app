import {
	validateId, validateLessonTitle, requiredText, validateVideoUrl, validateDisplayOrder
} from '../../lessons/lesson-validation.js';
import { integer, text, validateFields, type FormInput } from './shared.js';

// Replaces podcastValidation: lessons have content and a phase, with optional video.
export function lessonValidation(input: FormInput) {
	return validateFields(input, {
		phaseId: (value) => validateId(integer(value, 'Phase ID'), 'Phase ID'),
		title: (value) => validateLessonTitle(text(value, 'Title')),
		description: (value) => requiredText(text(value, 'Overview'), 'Overview'),
		content: (value) => requiredText(text(value, 'Content'), 'Content'),
		video_url: (value) => validateVideoUrl(value === undefined || value === null ? null : text(value, 'Video URL')),
		displayOrder: (value) => validateDisplayOrder(integer(value, 'Display order', 0))
	});
}
