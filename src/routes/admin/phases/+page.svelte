<script lang="ts">
 import FormErrors from '#lib/FormErrors.svelte';
 import type { PageProps } from './$types';
 let { data, form }: PageProps = $props();
</script>
<svelte:head><title>Manage phases | Phase Ready</title></svelte:head>
<h1>Manage course phases</h1><FormErrors errors={form?.errors}/>
<section class="card"><h2>Add a phase</h2><form method="POST" action="?/create" class="editor">
 <label>Title<input name="title" required maxlength="225" value={form?.values?.id ? '' : form?.values?.title ?? ''}/></label>
 <label>Public overview<textarea name="overview" rows="3" value={form?.values?.id ? '' : form?.values?.overview ?? ''}></textarea></label>
 <label>Display order<input type="number" name="displayOrder" min="0" step="1" max="2147483647" value={form?.values?.id ? 0 : form?.values?.displayOrder ?? 0}/></label>
 <button type="submit">Add phase</button>
</form></section>
<h2>Existing phases</h2>{#each data.phases as phase}<section class="card"><h3>{phase.title}</h3><form method="POST" action="?/update" class="editor">
 <input type="hidden" name="id" value={phase.id}/>
 <label>Title<input name="title" required maxlength="225" value={form?.values?.id === String(phase.id) ? form.values.title : phase.title}/></label>
 <label>Public overview<textarea name="overview" rows="3" value={form?.values?.id === String(phase.id) ? form.values.overview : phase.overview}></textarea></label>
 <label>Display order<input type="number" name="displayOrder" min="0" step="1" max="2147483647" value={form?.values?.id === String(phase.id) ? form.values.displayOrder : phase.display_order}/></label>
 <button type="submit">Save phase</button><a href={'/phases/' + phase.id}>View phase</a>
</form></section>{:else}<p>Add your first phase to start organizing lessons.</p>{/each}
