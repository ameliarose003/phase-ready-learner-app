<script lang="ts">
 import type { PageProps } from './$types';
 let { data }: PageProps = $props();
</script>
<svelte:head><title>{data.phase.title} | Phase Ready</title></svelte:head>
<p><a href="/phases">All phases</a></p><h1>{data.phase.title}</h1><p>{data.phase.overview}</p>
<h2>Lessons</h2><div class="cards">{#each data.lessons as lesson}<article class="card"><h3>{lesson.title}</h3><p>{lesson.description}</p><a href={'/lessons/' + lesson.id}>{data.isLoggedIn ? 'Read lesson' : 'Log in to read this lesson'}</a></article>{:else}<p>Lessons for this phase are coming soon.</p>{/each}</div>
