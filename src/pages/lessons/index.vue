<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { usePageHead, confirmAction } from '#lib/page.js';
import type { FormState } from '#lib/form-types.js';

 
 const { data } = defineProps<{ data: Record<string, any>; form?: FormState }>();
usePageHead(() => ({ title: "Course lessons | Phase Ready" }));
</script>

<template>
<h1>Course lessons</h1>
<template v-if="data.isLoggedIn">
 <p>Choose a lesson to read the course material and watch its video, when available.</p>
</template><template v-else>
 <p>Browse the lesson overviews. <a href="/login">Log in</a> or <a href="/signup">create an account</a> to take the course.</p>
</template>
<template v-if="data.currentUser?.role_name === 'admin'"><p><a class="action-link" href="/lessons/upload-video">Add a lesson</a></p></template>
<template v-if="(data.phases).length"><template v-for="phase in data.phases">
 <section>
  <h2><a :href="'/phases/' + phase.id">{{ phase.title }}</a></h2>
  <p>{{ phase.overview }}</p>
  <div class="cards">
   <template v-if="(data.lessons.filter((lesson: any) => lesson.phase_id === phase.id)).length"><template v-for="lesson in data.lessons.filter((lesson: any) => lesson.phase_id === phase.id)">
    <article class="card">
     <h3>{{ lesson.title }}</h3><p>{{ lesson.description }}</p>
     <p><a class="action-link" :href="'/lessons/' + lesson.id">{{ data.isLoggedIn ? 'Start lesson' : 'Log in to take this lesson' }}</a></p>
     <template v-if="data.currentUser?.role_name === 'admin'">
      <div class="actions">
       <a :href="'/lessons/' + lesson.id + '/edit'">Edit lesson</a>
       <form method="POST" :action="'/lessons/' + lesson.id + '/delete'" @submit="(event: Event) => { if (!confirmAction('Delete the lesson ' + lesson.title + '?')) event.preventDefault(); }">
        <button class="danger" type="submit">Delete lesson</button>
       </form>
      </div>
     </template>
    </article>
   </template></template><template v-else><p>No lessons in this phase yet.</p></template>
  </div>
 </section>
</template></template><template v-else><p>No course phases have been added yet.</p></template>
<p><a href="/">Return to the home page</a></p>
</template>

