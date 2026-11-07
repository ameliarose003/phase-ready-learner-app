<script lang="ts">
	import { onMount } from 'svelte';
	import { sessionUser } from '#lib/session.js';
	import { readProgress, saveProgress, syncProgress, progressRequest } from '#lib/offline-progress.js';
	let { lessonId }: { lessonId: number } = $props();
	let completed = $state(false);
	let busy = $state(true);
	let message = $state('Loading saved progress…');
	let owner = $derived($sessionUser?.role_name === 'user' ? String($sessionUser.id) : 'guest');
	let generation = 0;
	async function load() {
		const current = ++generation;
		const account = owner;
		busy = true;
		try {
			let saved = await readProgress(account, lessonId);
			if (account !== 'guest') {
				try {
					await syncProgress(Number(account));
					saved = await readProgress(account, lessonId);
					const remote = await progressRequest(Number(account), lessonId, { opened: true });
					if (!saved?.pending) saved = await saveProgress(account, lessonId, remote.completed, false);
				} catch { /* Pending changes remain local until this account reconnects. */ }
			}
			if (current !== generation) return;
			completed = saved?.completed ?? false;
			message = account === 'guest' ? 'Progress is saved on this device. Guest progress is separate from account progress.'
				: saved?.pending ? 'Saved on this device. Waiting to sync.' : 'Account progress loaded. Changes save on this device first.';
		} catch { if (current === generation) message = 'Local storage is unavailable. Reading is still available.'; }
		finally { if (current === generation) busy = false; }
	}
	$effect(() => { owner; lessonId; void load(); });
	onMount(() => {
		window.addEventListener('online', load);
		return () => { generation++; window.removeEventListener('online', load); };
	});
	async function toggle() {
		busy = true;
		const current = ++generation;
		const account = owner;
		try {
			const next = !completed;
			await saveProgress(account, lessonId, next, account !== 'guest');
			if (current !== generation) return;
			completed = next;
			message = account === 'guest' ? 'Saved on this device.' : 'Saved on this device. Waiting to sync.';
			if (account !== 'guest') {
				await syncProgress(Number(account));
				const saved = await readProgress(account, lessonId);
				if (current === generation && !saved?.pending) message = 'Progress synchronized with your account.';
			}
		} catch { if (current === generation) message = 'Unable to sync or save progress. Please check your connection and browser storage, then retry.'; }
		finally { if (current === generation) busy = false; }
	}
</script>

<section class="card" aria-label="Lesson completion">
	<h2>{completed ? 'Lesson completed' : 'Finished this lesson?'}</h2>
	<button type="button" onclick={toggle} disabled={busy}>{completed ? 'Mark as incomplete' : 'Mark lesson complete'}</button>
	<p role="status">{message}</p>
	<noscript><p>Enable JavaScript to save progress. You can read every guide without it.</p></noscript>
	<p><a href="/dashboard">View your course progress</a> (sign-in and internet required)</p>
</section>
