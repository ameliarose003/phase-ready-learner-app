import db from '../db.js';

export type LearnerLesson = {
	id: number; title: string; phase_id: number; phase_title: string;
	completed_at: Date | null; last_opened_at: Date | null;
};

export async function getLearnerLessons(userId: number): Promise<LearnerLesson[]> {
	const result = await db.query(`
		SELECT lessons.id, lessons.title, lessons.phase_id, phases.title AS phase_title,
		       lesson_progress.completed_at, lesson_progress.last_opened_at
		FROM lessons JOIN phases ON phases.id = lessons.phase_id
		LEFT JOIN lesson_progress ON lesson_progress.lesson_id = lessons.id AND lesson_progress.user_id = $1
		ORDER BY phases.display_order, phases.id, lessons.display_order, lessons.id
	`, [userId]);
	return result.rows;
}

export async function openLesson(userId: number, lessonId: number) {
	await db.query(`
		INSERT INTO lesson_progress (user_id, lesson_id) VALUES ($1, $2)
		ON CONFLICT (user_id, lesson_id) DO UPDATE SET last_opened_at = CURRENT_TIMESTAMP
	`, [userId, lessonId]);
}

export async function isLessonComplete(userId: number, lessonId: number) {
	const result = await db.query('SELECT completed_at FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
	return Boolean(result.rows[0]?.completed_at);
}

export async function setLessonCompletion(userId: number, lessonId: number, complete: boolean) {
	// The user ID always comes from the authenticated session, never the form.
	const result = await db.query(`
		INSERT INTO lesson_progress (user_id, lesson_id, completed_at)
		SELECT $1, id, CASE WHEN $3 THEN CURRENT_TIMESTAMP ELSE NULL END FROM lessons WHERE id = $2
		ON CONFLICT (user_id, lesson_id) DO UPDATE
		SET completed_at = CASE WHEN $3 THEN COALESCE(lesson_progress.completed_at, CURRENT_TIMESTAMP) ELSE NULL END
		RETURNING lesson_id
	`, [userId, lessonId, complete]);
	return (result.rowCount ?? 0) > 0;
}
