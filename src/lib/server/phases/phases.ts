import db from '../db.js';
import { createSlug } from '../setup.js';
import { validateId, validateLessonTitle, validateDisplayOrder } from '../lessons/lesson-validation.js';

export type Phase = { id: number; title: string; overview: string; slug: string; display_order: number };
export type PhaseInput = { title: string; overview: string; displayOrder: number };

export async function getAllPhases(): Promise<Phase[]> {
	const result = await db.query('SELECT id, title, overview, slug, display_order FROM phases ORDER BY display_order, id');
	return result.rows;
}

export async function getPhaseById(id: number): Promise<Phase | null> {
	validateId(id, 'Phase ID');
	const result = await db.query('SELECT id, title, overview, slug, display_order FROM phases WHERE id = $1', [id]);
	return result.rows[0] ?? null;
}

function phaseValues(input: PhaseInput) {
	const title = validateLessonTitle(input.title);
	if (typeof input.overview !== 'string') throw new Error('Overview must be text.');
	return [title, input.overview.trim(), createSlug(title), validateDisplayOrder(input.displayOrder)];
}

export async function savePhase(input: PhaseInput) {
	const result = await db.query(
		'INSERT INTO phases (title, overview, slug, display_order) VALUES ($1, $2, $3, $4) RETURNING id', phaseValues(input)
	);
	return result.rows[0];
}

export async function updatePhase(id: number, input: PhaseInput) {
	validateId(id, 'Phase ID');
	const result = await db.query(
		`UPDATE phases SET title = $1, overview = $2, slug = $3, display_order = $4,
		 updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id`, [...phaseValues(input), id]
	);
	return result.rows[0] ?? null;
}
