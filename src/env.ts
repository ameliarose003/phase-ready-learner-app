// Private server configuration comes from process.env; it is never exposed to Vue.
export const variables = { DB_URL: process.env.DB_URL ?? '', ENABLE_SQL_LOGGING: process.env.ENABLE_SQL_LOGGING ?? 'false' };
