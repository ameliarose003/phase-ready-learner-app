<script lang="ts">
 import type { PageProps } from './$types';
 let { data }: PageProps = $props();
</script>
<svelte:head><title>Your dashboard | Phase Ready</title></svelte:head>
<h1>Welcome, {data.user.name}</h1><p>Your learner dashboard</p>
<section class="card" aria-labelledby="progress-heading">
 <h2 id="progress-heading">Course progress</h2>
 <p>{data.completedLessons.length} of {data.totalLessons} lessons completed · {data.progressPercent}%</p>
 <progress max="100" value={data.progressPercent} aria-label="Course completion">{data.progressPercent}%</progress>
 {#if data.totalLessons === 0}<p>Your course lessons are coming soon.</p>{/if}
</section>
<section class="card" aria-labelledby="continue-heading">
 <h2 id="continue-heading">Continue learning</h2>
 {#if data.nextLesson}
  <p class="hint">{data.nextLesson.phase_title}</p>
  <h3>{data.nextLesson.title}</h3>
  <a class="action-link" href={'/lessons/' + data.nextLesson.id}>{data.nextLesson.last_opened_at ? 'Continue lesson' : 'Start lesson'}</a>
 {:else if data.totalLessons > 0}
  <p>You have completed every lesson currently in the course. You can revisit any lesson below.</p>
  <a href="/lessons">Review the course</a>
 {:else}<a href="/phases">Explore the course phases</a>{/if}
</section>
<h2>Your phases</h2>
<div class="cards">{#each data.phaseProgress as phase}<article class="card"><h3><a href={'/phases/' + phase.id}>{phase.title}</a></h3><p>{phase.overview}</p><p>{phase.completed} of {phase.total} lessons completed</p></article>{:else}<p>No phases have been published yet.</p>{/each}</div>
<section aria-labelledby="completed-heading">
 <h2 id="completed-heading">Completed lessons</h2>
 <div class="cards">{#each data.completedLessons as lesson}<article class="card"><p class="hint">{lesson.phase_title}</p><h3>{lesson.title}</h3><a href={'/lessons/' + lesson.id}>Review lesson</a></article>{:else}<p>Your completed lessons will appear here. Open a lesson and select “Mark lesson complete” when you finish.</p>{/each}</div>
</section>
<section class="card" aria-labelledby="account-heading">
 <h2 id="account-heading">Your account</h2>
 <dl class="account-details">
  <dt>Name</dt><dd>{data.user.name}</dd>
  <dt>Email</dt><dd>{data.user.email}</dd>
  <dt>Account created</dt><dd><time datetime={data.accountCreated.datetime}>{data.accountCreated.label}</time></dd>
 </dl>
 <div class="actions"><a href={'/users/' + data.user.id + '/edit'}>Edit your account</a><form method="POST" action="/logout"><button type="submit">Log out</button></form></div>
</section>

<style>
 progress { width: 100%; height: 1rem; accent-color: #173d45; }
 .account-details { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: .5rem 1.5rem; }
 .account-details dt { font-weight: 600; }
 .account-details dd { margin: 0; }
 @media (max-width: 600px) { .account-details { grid-template-columns: 1fr; gap: .2rem; } .account-details dd { margin-bottom: .7rem; } }
</style>
