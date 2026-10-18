<script lang="ts">
 import { onMount } from 'svelte';
 import Icon from '#lib/Icon.svelte';
 import FormErrors from '#lib/FormErrors.svelte';
 import type { FormState } from '#lib/form-types.js';
 let { form, onDismiss }: { form: FormState; onDismiss: () => void } = $props();
 let dialog = $state<HTMLDialogElement>();
 let errors = $derived(form?.errors ?? {});
 onMount(() => {
  if (!dialog) return;
  // Keep the form available without JavaScript, then enable native modal focus handling.
  dialog.removeAttribute('open');
  dialog.showModal();
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return () => { document.body.style.overflow = previousOverflow; };
 });
</script>

<dialog open bind:this={dialog} class="preview-dialog login-dialog" aria-labelledby="login-title" aria-describedby="login-description" oncancel={(event) => { event.preventDefault(); onDismiss(); }}>
 <div class="dialog-top">
  <span class="eyebrow">PHASE READY</span>
  <a href="/" class="close-button" aria-label="Close login" onclick={(event) => { event.preventDefault(); onDismiss(); }}><Icon name="close"/></a>
 </div>
 <div class="dialog-symbol"><Icon name="user" size={32}/></div>
 <h2 id="login-title">Welcome back</h2>
 <p id="login-description">Your readiness journey, all in one place.</p>
 <FormErrors {errors}/>
 <form method="POST" action="/login" class="login-preview">
  <label for="login-email">Email address</label>
  <input id="login-email" type="email" name="email" required autocomplete="username" maxlength="225" placeholder="you@example.com" aria-invalid={errors.email ? 'true' : undefined} value={form?.values?.email ?? ''}/>
  <label for="login-password">Password</label>
  <input id="login-password" type="password" name="password" required autocomplete="current-password" placeholder="Enter your password" aria-invalid={errors.password ? 'true' : undefined}/>
  <button class="button dark" type="submit">Log in <Icon name="arrow" size={18}/></button>
 </form>
 <p class="signup-link">New here? <a href="/signup">Create an account</a></p>
</dialog>

<style>
 .login-dialog { max-height: calc(100dvh - 2rem); overflow-y: auto; }
 .login-dialog:not(:modal) { position: fixed; inset: 0; margin: auto; z-index: 100; box-shadow: 0 0 0 100vmax #000b; }
 .close-button { display: grid; place-items: center; text-decoration: none; flex-shrink: 0; }
 .signup-link { font-size: .9rem; margin-bottom: 0; }
 .signup-link a { color: #79bafa; text-underline-offset: 3px; }
 :global(.login-dialog .form-errors) { padding: .8rem 1rem; margin: 1rem 0; border: 1px solid #ad544a; border-radius: 4px; background: #381c1b; color: #ffe1db; }
 :global(.login-dialog .form-errors ul) { margin: 0; padding-left: 1.2rem; }
</style>
