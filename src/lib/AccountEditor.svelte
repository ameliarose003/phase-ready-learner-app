<script lang="ts">
 import FormErrors from '#lib/FormErrors.svelte';
 import type { FormState, EditableUser } from '#lib/form-types.js';
 let { user, canEditRole, cancelHref, form }: { user: EditableUser; canEditRole: boolean; cancelHref: string; form: FormState } = $props();
</script>
<h1>Edit account</h1>
<p>Update your account information here.</p>
<FormErrors errors={form?.errors}/>
<form method="POST" action={'/users/' + user.id + '/update'} class="editor" onsubmit={(event) => { if (!window.confirm('Update this account?')) event.preventDefault(); }}>
 <label>Name<input name="name" autocomplete="name" required maxlength="225" value={form?.values?.name ?? user.name}/></label>
 <label>Email<input name="email" type="email" autocomplete="email" required maxlength="225" value={form?.values?.email ?? user.email}/></label>
 {#if canEditRole}<label>Role<select name="role_name" value={form?.values?.role_name ?? user.role_name}><option value="user">Learner</option><option value="admin">Admin</option></select></label>{:else}<p><strong>Role:</strong> {user.role_name === 'admin' ? 'Admin' : 'Learner'}</p>{/if}
 <div class="actions"><button type="submit">Save account</button><a href={cancelHref}>Cancel</a>{#if cancelHref !== '/dashboard'}<a href="/dashboard">Return to dashboard</a>{/if}</div>
</form>
