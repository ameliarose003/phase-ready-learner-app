export type FormInput = FormData | Record<string, unknown>;
export type FieldErrors = Record<string, string>;
export type ValidationResult<T> =
	| { success: true; data: T; errors: FieldErrors }
	| { success: false; data: null; errors: FieldErrors };

type Rules = Record<string, (value: unknown) => unknown>;
type Parsed<S extends Rules> = { [K in keyof S]: ReturnType<S[K]> };

export function text(value: unknown, label: string): string {
	if (typeof value !== 'string') throw new Error(`${label} must be text.`);
	return value;
}

export function integer(value: unknown, label: string, defaultValue?: number): number {
	if (value === undefined || value === null || value === '') {
		if (defaultValue !== undefined) return defaultValue;
		throw new Error(`${label} is required.`);
	}
	if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim());
	if (typeof value === 'number' && Number.isInteger(value)) return value;
	throw new Error(`${label} must be a whole number.`);
}

export function validateFields<S extends Rules>(input: FormInput, rules: S): ValidationResult<Parsed<S>> {
	const data: Record<string, unknown> = {};
	const errors: FieldErrors = {};
	for (const [field, parse] of Object.entries(rules)) {
		try {
			let value: unknown;
			if (input instanceof FormData) {
				const entries = input.getAll(field);
				if (entries.length > 1) throw new Error('Submit this field only once.');
				value = entries[0];
			} else {
				if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid form data.');
				value = Object.hasOwn(input, field) ? input[field] : undefined;
			}
			data[field] = parse(value);
		} catch (error) {
			errors[field] = error instanceof Error ? error.message : 'Invalid value.';
		}
	}
	return Object.keys(errors).length
		? { success: false, data: null, errors }
		: { success: true, data: data as Parsed<S>, errors };
}
