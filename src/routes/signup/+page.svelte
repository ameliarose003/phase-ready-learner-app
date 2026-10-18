<script lang="ts">
 import FormErrors from '#lib/FormErrors.svelte';
 import type { PageProps } from './$types';
 let { form }: PageProps = $props();
 let errors: Record<string, string> = $derived(form?.errors ?? {});
</script>
<svelte:head><title>Sign up | Phase Ready</title></svelte:head>
<h1>Create your learner account</h1><p>Take the course at your own pace.</p>
<FormErrors {errors}/>
<form method="POST" action="/signup" class="editor">
 <label for="signup-name">Name<input id="signup-name" type="text" name="name" required maxlength="225" autocomplete="name" aria-invalid={!!errors.name} value={form?.values?.name ?? ''}/></label>
 <label for="signup-email">Email<input id="signup-email" type="email" name="email" required maxlength="225" autocomplete="email" aria-invalid={!!errors.email} value={form?.values?.email ?? ''}/></label>
 <label for="signup-confirm-email">Confirm email<input id="signup-confirm-email" type="email" name="confirmEmail" required maxlength="225" autocomplete="email" aria-invalid={!!errors.confirmEmail} value={form?.values?.confirmEmail ?? ''}/></label>
 <label for="signup-password">Password<input id="signup-password" type="password" name="password" required minlength="12" autocomplete="new-password" aria-invalid={!!errors.password}/></label>
 <label for="signup-confirm-password">Confirm password<input id="signup-confirm-password" type="password" name="confirmPassword" required minlength="12" autocomplete="new-password" aria-invalid={!!errors.confirmPassword}/></label>
 <p class="hint">Use a passphrase of at least 12 characters.</p><button type="submit">Create account</button>
</form>
<p>Already registered? <a href="/login">Log in</a></p>
