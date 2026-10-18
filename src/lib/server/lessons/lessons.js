import db from '../db.js';
import { validateId, requiredText, validateLesson } from './lesson-validation.js';

/**
 * @typedef {import('./lesson-validation.js').LessonInput} LessonInput
 */

// This model only accesses data. Server loads/actions must verify learner access
// before reading full content and admin access before creating/updating/deleting.
const overviewColumns = 'id, phase_id, title, description, slug, display_order, created_at, updated_at';
const fullColumns = `${overviewColumns}, content, video_url`;

// Database failures deliberately propagate. A failed query must not look like
// an available title, an empty course, or a missing lesson.
/** @param {string} title @param {number} phaseId @param {number | null} [excludeId] */
export async function titleExists(title, phaseId, excludeId = null) {
	validateId(phaseId, 'Phase ID');
	if (excludeId !== null) validateId(excludeId);
	const result = await db.query(
		`SELECT EXISTS (
			SELECT 1 FROM lessons
			WHERE phase_id = $1 AND LOWER(title) = LOWER($2)
			AND ($3::integer IS NULL OR id <> $3)
		) AS exists`,
		[phaseId, requiredText(title, 'Title'), excludeId]
	);
	return Boolean(result.rows[0].exists);
}

/** @param {LessonInput} input */
export async function saveLesson(input) {
	const lesson = validateLesson(input);
	const result = await db.query(
		`INSERT INTO lessons (phase_id, video_url, title, description, content, slug, display_order)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING ${fullColumns}`,
		[lesson.phaseId, lesson.video_url, lesson.title, lesson.description, lesson.content, lesson.slug, lesson.displayOrder]
	);
	return result.rows[0] ?? null;
}

// Safe to use for public previews: full content and video links are not selected.
/** @param {number} [phaseId] */
export async function getAllLessons(phaseId) {
	if (phaseId !== undefined) validateId(phaseId, 'Phase ID');
	const result = await db.query(
		`SELECT ${overviewColumns} FROM lessons
		 WHERE ($1::integer IS NULL OR phase_id = $1)
		 ORDER BY phase_id, display_order, id`,
		[phaseId ?? null]
	);
	return result.rows;
}

/** @param {number} id */
export async function getLessonById(id) {
	validateId(id);
	const result = await db.query(`SELECT ${fullColumns} FROM lessons WHERE id = $1`, [id]);
	return result.rows[0] ?? null;
}

/** @param {number} id @param {LessonInput} input */
export async function updateLesson(id, input) {
	validateId(id);
	const lesson = validateLesson(input);
	const result = await db.query(
		`UPDATE lessons
		 SET phase_id = $1, video_url = $2, title = $3, description = $4, content = $5,
		     slug = $6, display_order = $7, updated_at = CURRENT_TIMESTAMP
		 WHERE id = $8
		 RETURNING ${fullColumns}`,
		[lesson.phaseId, lesson.video_url, lesson.title, lesson.description, lesson.content, lesson.slug, lesson.displayOrder, id]
	);
	return result.rows[0] ?? null;
}

/** @param {number} id */
export async function deleteLesson(id) {
	validateId(id);
	const result = await db.query('DELETE FROM lessons WHERE id = $1', [id]);
	return (result.rowCount ?? 0) > 0;
}
