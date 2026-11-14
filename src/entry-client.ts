import { createApp, type PageState } from './app.js';
const element = document.getElementById('page-state');
if (element?.textContent) {
 const state: PageState = JSON.parse(element.textContent);
 const {app, head} = createApp(state);
 app.mount('#app');
 document.title = head.value.title;
}
