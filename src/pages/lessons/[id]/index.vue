<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { usePageHead } from '#lib/page.js';
import type { FormState } from '#lib/form-types.js';

 
 const { data } = defineProps<{ data: Record<string, any>; form?: FormState }>();
usePageHead(() => ({ title: (data.lesson.title) + " | Phase Ready" }));
</script>

<template>
<p><a :href="'/phases/' + data.lesson.phase_id">Back to phase</a></p><h1>{{ data.lesson.title }}</h1><p>{{ data.lesson.description }}</p>
<template v-if="data.currentUser?.role_name === 'admin'"><p><a :href="'/lessons/' + data.lesson.id + '/edit'">Edit lesson</a></p></template>
<template v-if="data.lesson.video_url"><video controls preload="metadata" :src="data.lesson.video_url"><track kind="captions" /><p><a :href="data.lesson.video_url">Open video</a></p></video><p><a :href="data.lesson.video_url" target="_blank" rel="noopener noreferrer">Open video in a new tab</a></p></template>
<article class="lesson-body" v-html="data.lessonHtml"></article>
<template v-if="data.currentUser?.role_name === 'user'">
 <section class="card" aria-label="Lesson completion">
  <h2>{{ data.completed ? 'Lesson completed' : 'Finished this lesson?' }}</h2>
  <form method="POST" :action="data.completed ? '?/reopen' : '?/complete'"><button type="submit">{{ data.completed ? 'Mark as incomplete' : 'Mark lesson complete' }}</button></form>
  <p><a href="/dashboard">View your course progress</a></p>
 </section>
</template>
<p><a href="/lessons">Return to all lessons</a></p>
</template>

