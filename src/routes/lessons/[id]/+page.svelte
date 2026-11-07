<script lang="ts">
 import type { PageProps } from './$types';
 import { sessionUser } from '#lib/session.js';
 import LessonProgress from '#lib/LessonProgress.svelte';
 let { data }: PageProps = $props();
</script>
<svelte:head><title>{data.lesson.title} | Phase Ready</title></svelte:head>
<p><a href={'/phases/' + data.lesson.phase_id}>Back to phase</a></p><h1>{data.lesson.title}</h1><p>{data.lesson.description}</p>
{#if $sessionUser?.role_name === 'admin'}<p><a href={'/lessons/' + data.lesson.id + '/edit'}>Edit lesson</a></p>{/if}
{#if data.lesson.video_url}<video controls preload="none" src={data.lesson.video_url}><track kind="captions"/><p><a href={data.lesson.video_url}>Open video</a></p></video><p>Videos require an internet connection. <a href={data.lesson.video_url} target="_blank" rel="noopener noreferrer">Open video in a new tab</a></p>{/if}
<article class="lesson-body">{@html data.lessonHtml}</article>
<LessonProgress lessonId={data.lesson.id} />
<p><a href="/lessons">Return to all lessons</a></p>
