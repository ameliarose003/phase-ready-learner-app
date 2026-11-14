<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { usePageHead } from '#lib/page.js';
import type { FormState } from '#lib/form-types.js';

 
 const { data } = defineProps<{ data: Record<string, any>; form?: FormState }>();
usePageHead(() => ({ title: "Course phases | Phase Ready" }));
</script>

<template>
<h1>The Phase Ready course</h1><p>Explore each phase's overview. Log in to read the lessons.</p>
<template v-if="data.currentUser?.role_name === 'admin'"><p><a href="/admin/phases">Manage phases</a></p></template>
<div class="cards"><template v-if="(data.phases).length"><template v-for="phase in data.phases"><article class="card"><h2><a :href="'/phases/' + phase.id">{{ phase.title }}</a></h2><p>{{ phase.overview }}</p></article></template></template><template v-else><p>No phases have been added yet.</p></template></div>
</template>

