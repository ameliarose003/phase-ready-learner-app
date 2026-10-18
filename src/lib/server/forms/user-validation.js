import { Buffer } from 'node:buffer';

/** @param {string} email */
export function normalizeEmail(email) {
	if (typeof email !== 'string') throw new Error('Email is required.');
	const normalized = email.trim().toLowerCase();
	if (normalized.length > 225 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
		throw new Error('Enter a valid email address of 225 characters or fewer.');
	}
	return normalized;
}

/** @param {string} name */
export function validateName(name) {
	if (typeof name !== 'string' || !name.trim() || name.trim().length > 225) {
		throw new Error('Name must contain between 1 and 225 characters.');
	}
	return name.trim();
}

/** @param {number} id */
export function validateUserId(id) {
	if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
		throw new Error('User ID must be a positive PostgreSQL integer.');
	}
}

/** @param {string} password */
export function validateLoginPassword(password) {
	if (typeof password !== 'string' || !password) throw new Error('Password is required.');
	if (Buffer.byteLength(password, 'utf8') > 72) throw new Error('Password must be 72 UTF-8 bytes or fewer.');
	return password;
}

/** @param {string} password */
export function validateNewPassword(password) {
	validateLoginPassword(password);
	if (Array.from(password).length < 12) throw new Error('Password must contain at least 12 characters.');
	return password;
}

/** @param {string} role */
export function validateRole(role) {
	if (role !== 'user' && role !== 'admin') throw new Error('Role must be user or admin.');
	return role;
}
