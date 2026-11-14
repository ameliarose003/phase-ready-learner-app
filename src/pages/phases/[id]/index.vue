<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { usePageHead } from '#lib/page.js';
import type { FormState } from '#lib/form-types.js';

 
 const { data } = defineProps<{ data: Record<string, any>; form?: FormState }>();
usePageHead(() => ({ title: (data.phase.title) + " | Phase Ready" }));
</script>

<template>
<p><a href="/phases">All phases</a></p><h1>{{ data.phase.title }}</h1><p>{{ data.phase.overview }}</p>
<h2>Lessons</h2><div class="cards"><template v-if="(data.lessons).length"><template v-for="lesson in data.lessons"><article class="card"><h3>{{ lesson.title }}</h3><p>{{ lesson.description }}</p><a :href="'/lessons/' + lesson.id">{{ data.isLoggedIn ? 'Read lesson' : 'Log in to read this lesson' }}</a></article></template></template><template v-else><p>Lessons for this phase are coming soon.</p></template></div>
</template>

