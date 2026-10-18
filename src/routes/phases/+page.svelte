<script lang="ts">
 import type { PageProps } from './$types';
 let { data }: PageProps = $props();
</script>
<svelte:head><title>Course phases | Phase Ready</title></svelte:head>
<h1>The Phase Ready course</h1><p>Explore each phase's overview. Log in to read the lessons.</p>
{#if data.currentUser?.role_name === 'admin'}<p><a href="/admin/phases">Manage phases</a></p>{/if}
<div class="cards">{#each data.phases as phase}<article class="card"><h2><a href={'/phases/' + phase.id}>{phase.title}</a></h2><p>{phase.overview}</p></article>{:else}<p>No phases have been added yet.</p>{/each}</div>
