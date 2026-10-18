<script lang="ts">
 import type { PageProps } from './$types';
 let { data }: PageProps = $props();
</script>
<svelte:head><title>Course lessons | Phase Ready</title></svelte:head>
<h1>Course lessons</h1>
{#if data.isLoggedIn}
 <p>Choose a lesson to read the course material and watch its video, when available.</p>
{:else}
 <p>Browse the lesson overviews. <a href="/login">Log in</a> or <a href="/signup">create an account</a> to take the course.</p>
{/if}
{#if data.currentUser?.role_name === 'admin'}<p><a class="action-link" href="/lessons/upload-video">Add a lesson</a></p>{/if}
{#each data.phases as phase}
 <section>
  <h2><a href={'/phases/' + phase.id}>{phase.title}</a></h2>
  <p>{phase.overview}</p>
  <div class="cards">
   {#each data.lessons.filter((lesson) => lesson.phase_id === phase.id) as lesson}
    <article class="card">
     <h3>{lesson.title}</h3><p>{lesson.description}</p>
     <p><a class="action-link" href={'/lessons/' + lesson.id}>{data.isLoggedIn ? 'Start lesson' : 'Log in to take this lesson'}</a></p>
     {#if data.currentUser?.role_name === 'admin'}
      <div class="actions">
       <a href={'/lessons/' + lesson.id + '/edit'}>Edit lesson</a>
       <form method="POST" action={'/lessons/' + lesson.id + '/delete'} onsubmit={(event) => { if (!window.confirm('Delete the lesson ' + lesson.title + '?')) event.preventDefault(); }}>
        <button class="danger" type="submit">Delete lesson</button>
       </form>
      </div>
     {/if}
    </article>
   {:else}<p>No lessons in this phase yet.</p>{/each}
  </div>
 </section>
{:else}<p>No course phases have been added yet.</p>{/each}
<p><a href="/">Return to the home page</a></p>
