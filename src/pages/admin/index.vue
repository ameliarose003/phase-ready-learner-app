<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { usePageHead } from '#lib/page.js';
import type { FormState } from '#lib/form-types.js';

 const { data } = defineProps<{ data: Record<string, any>; form?: FormState }>();
usePageHead(() => ({ title: "Admin dashboard | Phase Ready" }));
</script>

<template>
<h1>Admin dashboard</h1><p>Welcome, {{ data.user.name }}. Manage the course and learner accounts here.</p>
<div class="actions"><a class="action-link" href="/phases">Explore the course</a></div>
<section class="card" aria-labelledby="account-heading">
 <h2 id="account-heading">Your account</h2>
 <dl class="account-details">
  <dt>Name</dt><dd>{{ data.user.name }}</dd>
  <dt>Email</dt><dd>{{ data.user.email }}</dd>
  <dt>Account created</dt><dd><time :datetime="data.accountCreated.datetime">{{ data.accountCreated.label }}</time></dd>
 </dl>
 <div class="actions"><a :href="'/users/' + data.user.id + '/edit'">Edit your account</a><form method="POST" action="/logout"><button type="submit">Log out</button></form></div>
</section>
<template v-if="data.user.role_name === 'admin'"><section class="card"><h2>Admin tools</h2><div class="actions"><a href="/admin/phases">Manage phases</a><a href="/lessons/upload-video">Add a lesson</a><a href="/lessons">Manage lessons</a><a href="/users">Manage users</a></div></section></template>
<h2>Course phases</h2><div class="cards"><template v-if="(data.phases).length"><template v-for="phase in data.phases"><article class="card"><h3><a :href="'/phases/' + phase.id">{{ phase.title }}</a></h3><p>{{ phase.overview }}</p></article></template></template><template v-else><p>No phases have been published yet.</p></template></div>
</template>

<style scoped>

 .account-details { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: .5rem 1.5rem; }
 .account-details dt { font-weight: 600; }
 .account-details dd { margin: 0; }
 @media (max-width: 600px) { .account-details { grid-template-columns: 1fr; gap: .2rem; } .account-details dd { margin-bottom: .7rem; } }

</style>
