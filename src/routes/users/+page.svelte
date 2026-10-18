<script lang="ts">
 import type { PageProps } from './$types';
 let { data }: PageProps = $props();
</script>
<svelte:head><title>Manage users | Phase Ready</title></svelte:head>
<h1>Manage users</h1>
<div class="cards">
 {#each data.users as user}
  <article class="card">
   <h2>{user.name}</h2><p>{user.email}</p>
   <div class="actions">
    <a href={'/users/' + user.id + '/edit'}>Edit account</a>
    {#if user.id !== data.currentUser?.id}
     <form method="POST" action={'/users/' + user.id + '/delete'} onsubmit={(event) => { if (!window.confirm('Delete the account for ' + user.name + '?')) event.preventDefault(); }}>
      <button class="danger" type="submit" aria-label={'Delete account for ' + user.name}>Delete account</button>
     </form>
    {:else}<span>Your account</span>{/if}
   </div>
  </article>
 {:else}<p>No registered users yet.</p>{/each}
</div>
<p><a href="/dashboard">Return to dashboard</a></p>
