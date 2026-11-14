import { inject, watchEffect, type InjectionKey, type Ref } from 'vue';
export type PageHead = {title: string};
export const pageHeadKey: InjectionKey<Ref<PageHead>> = Symbol('page-head');
export function usePageHead(getHead: () => PageHead) {
 const head = inject(pageHeadKey);
 if (head) watchEffect(() => { head.value = getHead(); });
}
export function confirmAction(message: string) { return window.confirm(message); }
