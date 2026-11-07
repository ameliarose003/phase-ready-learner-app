// Only these GET routes contain shared, build-time content. Never cache account routes.
export function isPublicGuide(pathname: string) {
	if (/^\/lessons\/upload-video\/?$/.test(pathname)) return false;
	return pathname === '/' || /^\/(phases|lessons)(\/[^/]+)?\/?$/.test(pathname)
		|| pathname === '/api/content/offline';
}
