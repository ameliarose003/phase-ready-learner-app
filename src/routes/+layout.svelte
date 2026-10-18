<script lang="ts">
	import type { LayoutProps } from './$types';
	import './portal.css';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</svelte:head>

{#each Object.entries(data.flashMessages) as [type, messages]}
	{#each messages as message}
		<div class="flash-message" class:error={type === 'error'} role={type === 'error' ? 'alert' : 'status'}>
			<strong>{type}:</strong> {message}
		</div>
	{/each}
{/each}

{#if data.pathname !== '/'}
	<header class="portal-header"><a class="portal-brand" href="/">Phase Ready</a><nav aria-label="Course navigation"><a href="/phases">Course phases</a><a href="/lessons">Lessons</a>{#if data.isLoggedIn}<a href={data.currentUser?.role_name === 'admin' ? '/admin' : '/dashboard'}>Dashboard</a><a href="/logout">Log out</a>{:else}<a href="/login">Log in</a><a href="/signup">Sign up</a>{/if}</nav></header>
	<main class="portal">{@render children()}</main>
{:else}
	{@render children()}
{/if}

<style>
	.flash-message { padding: 1rem; background: #e4f0f2; color: #183c46; font-family: system-ui, sans-serif; }
	.flash-message strong { text-transform: capitalize; }
	.flash-message.error { background: #f7e5df; color: #752e29; }
</style>
