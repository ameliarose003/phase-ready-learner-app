export type FormState = { errors?: Record<string, string>; values?: Record<string, string> } | null | undefined;
export type EditableLesson = { id: number; phase_id: number; title: string; description: string; content: string; video_url: string | null; display_order: number };
export type EditableUser = { id: number; name: string; email: string; role_name: string };
