import { createSSRApp, ref } from 'vue';
import App from './App.vue';
import ErrorPage from './pages/ErrorPage.vue';
import { pages } from './pages.js';
import { pageHeadKey, type PageHead } from './lib/page.js';
import type { FormState } from './lib/form-types.js';
export interface PageState {
 component: string; data: Record<string, any>; form: FormState; status: number; error: {message: string};
}
// Each request gets its own app and head state; user data is never shared across requests.
export function createApp(state: PageState) {
 const head = ref<PageHead>({title: 'Phase Ready — Preparedness starts with you'});
 const app = createSSRApp(App, {component: pages[state.component] ?? ErrorPage,
  data: state.data, form: state.form, page: {status: state.status, error: state.error}});
 app.provide(pageHeadKey, head);
 return {app, head};
}
