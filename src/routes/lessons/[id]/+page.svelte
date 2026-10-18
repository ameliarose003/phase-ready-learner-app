<script lang="ts">
 import type { PageProps } from './$types';
 let { data }: PageProps = $props();
</script>
<svelte:head><title>{data.lesson.title} | Phase Ready</title></svelte:head>
<p><a href={'/phases/' + data.lesson.phase_id}>Back to phase</a></p><h1>{data.lesson.title}</h1><p>{data.lesson.description}</p>
{#if data.currentUser?.role_name === 'admin'}<p><a href={'/lessons/' + data.lesson.id + '/edit'}>Edit lesson</a></p>{/if}
{#if data.lesson.video_url}<video controls preload="metadata" src={data.lesson.video_url}><track kind="captions"/><p><a href={data.lesson.video_url}>Open video</a></p></video><p><a href={data.lesson.video_url} target="_blank" rel="noopener noreferrer">Open video in a new tab</a></p>{/if}
<article class="lesson-body">{@html data.lessonHtml}</article>
{#if data.currentUser?.role_name === 'user'}
 <section class="card" aria-label="Lesson completion">
  <h2>{data.completed ? 'Lesson completed' : 'Finished this lesson?'}</h2>
  <form method="POST" action={data.completed ? '?/reopen' : '?/complete'}><button type="submit">{data.completed ? 'Mark as incomplete' : 'Mark lesson complete'}</button></form>
  <p><a href="/dashboard">View your course progress</a></p>
 </section>
{/if}
<p><a href="/lessons">Return to all lessons</a></p>
