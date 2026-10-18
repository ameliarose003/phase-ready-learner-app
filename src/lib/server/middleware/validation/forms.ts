import {
	normalizeEmail, validateName, validateNewPassword, validateLoginPassword, validateRole
} from '../../forms/user-validation.js';
import { text, validateFields, type FieldErrors, type FormInput, type ValidationResult } from './shared.js';

type RegistrationData = { name: string; email: string; password: string };

export function registrationValidation(input: FormInput): ValidationResult<RegistrationData> {
	const result = validateFields(input, {
		name: (value) => validateName(text(value, 'Name')),
		email: (value) => normalizeEmail(text(value, 'Email')),
		confirmEmail: (value) => normalizeEmail(text(value, 'Confirmation email')),
		password: (value) => validateNewPassword(text(value, 'Password')),
		confirmPassword: (value) => text(value, 'Confirmation password')
	});
	if (!result.success) return result;
	const { name, email, confirmEmail, password, confirmPassword } = result.data;
	const errors: FieldErrors = {};
	if (email !== confirmEmail) errors.confirmEmail = 'Email addresses do not match.';
	if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
	if (Object.keys(errors).length) return { success: false, data: null, errors };
	// Ignore unknown signup fields, including any caller-supplied role.
	return { success: true, data: { name, email, password }, errors };
}

export function loginValidation(input: FormInput) {
	return validateFields(input, {
		email: (value) => normalizeEmail(text(value, 'Email')),
		// Existing accounts are not required to meet the new-account minimum.
		password: (value) => validateLoginPassword(text(value, 'Password'))
	});
}

export function updateAccountValidation(input: FormInput, options: { allowRoleChange?: boolean } = {}) {
	return validateFields(input, {
		name: (value) => validateName(text(value, 'Name')),
		email: (value) => normalizeEmail(text(value, 'Email')),
		role_name: (value) => {
			if (value === undefined || value === null || value === '') return null;
			const role = text(value, 'Role').trim();
			if (!role) return null;
			if (!options.allowRoleChange) throw new Error('Role changes require administrator permission.');
			return validateRole(role);
		}
	});
}
