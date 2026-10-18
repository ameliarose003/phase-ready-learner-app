<script lang="ts">
 import FormErrors from '#lib/FormErrors.svelte';
 import type { PageProps } from './$types';
 let { form }: PageProps = $props();
 let errors: Record<string, string> = $derived(form?.errors ?? {});
</script>
<svelte:head><title>Log in | Phase Ready</title></svelte:head>
<h1>Welcome back</h1><p>Log in to read lessons and continue your course.</p>
<FormErrors {errors}/>
<form method="POST" action="/login" class="editor">
 <label for="login-email">Email<input id="login-email" type="email" name="email" required autocomplete="username" maxlength="225" placeholder="you@example.com" aria-invalid={errors.email ? 'true' : undefined} value={form?.values?.email ?? ''}/></label>
 <label for="login-password">Password<input id="login-password" type="password" name="password" required autocomplete="current-password" placeholder="Enter your password" aria-invalid={errors.password ? 'true' : undefined}/></label>
 <button type="submit">Log in</button>
</form>
<p>New here? <a href="/signup">Create an account</a></p>
