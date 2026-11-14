<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { usePageHead } from '#lib/page.js';
import type { FormState } from '#lib/form-types.js';

 import FormErrors from '#lib/FormErrors.vue';
 
 const { data, form } = defineProps<{ data: Record<string, any>; form?: FormState }>();
usePageHead(() => ({ title: "Manage phases | Phase Ready" }));
</script>

<template>
<h1>Manage course phases</h1><FormErrors :errors="form?.errors"></FormErrors>
<section class="card"><h2>Add a phase</h2><form method="POST" action="?/create" class="editor">
 <label>Title<input name="title" required maxlength="225" :value="form?.values?.id ? '' : form?.values?.title ?? ''" /></label>
 <label>Public overview<textarea name="overview" rows="3" :value="form?.values?.id ? '' : form?.values?.overview ?? ''"></textarea></label>
 <label>Display order<input type="number" name="displayOrder" min="0" step="1" max="2147483647" :value="form?.values?.id ? 0 : form?.values?.displayOrder ?? 0" /></label>
 <button type="submit">Add phase</button>
</form></section>
<h2>Existing phases</h2><template v-if="(data.phases).length"><template v-for="phase in data.phases"><section class="card"><h3>{{ phase.title }}</h3><form method="POST" action="?/update" class="editor">
 <input type="hidden" name="id" :value="phase.id" />
 <label>Title<input name="title" required maxlength="225" :value="form?.values?.id === String(phase.id) ? form.values.title : phase.title" /></label>
 <label>Public overview<textarea name="overview" rows="3" :value="form?.values?.id === String(phase.id) ? form.values.overview : phase.overview"></textarea></label>
 <label>Display order<input type="number" name="displayOrder" min="0" step="1" max="2147483647" :value="form?.values?.id === String(phase.id) ? form.values.displayOrder : phase.display_order" /></label>
 <button type="submit">Save phase</button><a :href="'/phases/' + phase.id">View phase</a>
</form></section></template></template><template v-else><p>Add your first phase to start organizing lessons.</p></template>
</template>

