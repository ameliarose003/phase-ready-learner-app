<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/env';
	let message = $state(dev ? 'Offline downloads are available in the production build.' : 'Preparing guides for offline reading…');
	let checking = $state(false);
	async function verify() {
		if (!('serviceWorker' in navigator)) { message = 'This browser does not support offline downloads.'; return; }
		if (!navigator.serviceWorker.controller) { message = 'Offline download is pending. Keep this page open, then check again.'; return; }
		checking = true;
		const channel = new MessageChannel();
		const timeout = window.setTimeout(() => {
			message = 'Unable to verify offline guides. Reconnect and check again.';
			checking = false;
			channel.port1.close();
		}, 10000);
		channel.port1.onmessage = ({ data }) => {
			window.clearTimeout(timeout);
			message = data.ready ? 'Ready for offline use — all guides downloaded. Videos require internet.'
				: 'Offline download is incomplete. Reconnect and reload to retry.';
			checking = false;
			channel.port1.close();
		};
		navigator.serviceWorker.controller.postMessage({ type: 'VERIFY_OFFLINE' }, [channel.port2]);
	}
	onMount(() => {
		if (dev || !('serviceWorker' in navigator)) return;
		void verify();
		navigator.serviceWorker.addEventListener('controllerchange', verify);
		window.addEventListener('online', verify);
		return () => {
			navigator.serviceWorker.removeEventListener('controllerchange', verify);
			window.removeEventListener('online', verify);
		};
	});
</script>

<aside class="offline-status" aria-label="Offline guides">
	<p role="status">{message}</p>
	{#if !dev}<button type="button" onclick={verify} disabled={checking}>{checking ? 'Checking…' : 'Check offline readiness'}</button>{/if}
</aside>

<style>
	.offline-status { padding: .75rem 1rem; margin-bottom: 1rem; background: #e4f0f2; color: #183c46; border-radius: .5rem; }
	p { margin: 0 0 .4rem; }
	button { font: inherit; cursor: pointer; }
</style>
