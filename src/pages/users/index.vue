<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { usePageHead, confirmAction } from '#lib/page.js';
import type { FormState } from '#lib/form-types.js';

 const { data } = defineProps<{ data: Record<string, any>; form?: FormState }>();
usePageHead(() => ({ title: "Manage users | Phase Ready" }));
</script>

<template>
<h1>Manage users</h1>
<div class="cards">
 <template v-if="(data.users).length"><template v-for="user in data.users">
  <article class="card">
   <h2>{{ user.name }}</h2><p>{{ user.email }}</p>
   <div class="actions">
    <a :href="'/users/' + user.id + '/edit'">Edit account</a>
    <template v-if="user.id !== data.currentUser?.id">
     <form method="POST" :action="'/users/' + user.id + '/delete'" @submit="(event: Event) => { if (!confirmAction('Delete the account for ' + user.name + '?')) event.preventDefault(); }">
      <button class="danger" type="submit" :aria-label="'Delete account for ' + user.name">Delete account</button>
     </form>
    </template><template v-else><span>Your account</span></template>
   </div>
  </article>
 </template></template><template v-else><p>No registered users yet.</p></template>
</div>
<p><a href="/dashboard">Return to dashboard</a></p>
</template>

