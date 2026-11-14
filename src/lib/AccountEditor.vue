<script setup lang="ts">
import { confirmAction } from '#lib/page.js';

 import FormErrors from '#lib/FormErrors.vue';
 import type { FormState, EditableUser } from '#lib/form-types.js';
 const { user, canEditRole, cancelHref, form } = defineProps<{ user: EditableUser; canEditRole: boolean; cancelHref: string; form: FormState }>();
</script>

<template>
<h1>Edit account</h1>
<p>Update your account information here.</p>
<FormErrors :errors="form?.errors"></FormErrors>
<form method="POST" :action="'/users/' + user.id + '/update'" class="editor" @submit="(event: Event) => { if (!confirmAction('Update this account?')) event.preventDefault(); }">
 <label>Name<input name="name" autocomplete="name" required maxlength="225" :value="form?.values?.name ?? user.name" /></label>
 <label>Email<input name="email" type="email" autocomplete="email" required maxlength="225" :value="form?.values?.email ?? user.email" /></label>
 <template v-if="canEditRole"><label>Role<select name="role_name" :value="form?.values?.role_name ?? user.role_name"><option value="user" :selected="String('user') === String(form?.values?.role_name ?? user.role_name)">Learner</option><option value="admin" :selected="String('admin') === String(form?.values?.role_name ?? user.role_name)">Admin</option></select></label></template><template v-else><p><strong>Role:</strong> {{ user.role_name === 'admin' ? 'Admin' : 'Learner' }}</p></template>
 <div class="actions"><button type="submit">Save account</button><a :href="cancelHref">Cancel</a><template v-if="cancelHref !== '/dashboard'"><a href="/dashboard">Return to dashboard</a></template></div>
</form>
</template>

