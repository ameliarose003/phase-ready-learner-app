<script lang="ts">
 import FormErrors from '#lib/FormErrors.svelte';
 import type { FormState, EditableLesson } from '#lib/form-types.js';
 let { phases, lesson, form }: { phases: { id: number; title: string }[]; lesson: EditableLesson | null; form: FormState } = $props();
</script>
<h1>{lesson ? 'Edit lesson' : 'Add a lesson'}</h1>
{#if lesson}<p><a href={'/lessons/' + lesson.id}>View lesson</a></p>{/if}
<p>Add written content and an optional direct video link. A Markdown file can replace the text you enter below.</p>
<FormErrors errors={form?.errors}/>
{#if phases.length === 0}<p class="notice">Create a phase before adding a lesson. <a href="/admin/phases">Manage phases</a></p>{/if}
<form method="POST" enctype="multipart/form-data" action={lesson ? '/lessons/' + lesson.id + '/update' : '/lessons/upload-video'} class="editor" onsubmit={(event) => { if (lesson && !window.confirm('Update this lesson?')) event.preventDefault(); }}>
 <label>Phase<select name="phaseId" required value={form?.values?.phaseId ?? lesson?.phase_id ?? ''}><option value="" disabled>Choose a phase</option>{#each phases as phase}<option value={phase.id}>{phase.title}</option>{/each}</select></label>
 <label>Title<input name="title" required maxlength="225" value={form?.values?.title ?? lesson?.title ?? ''}/></label>
 <label>Public overview<textarea name="description" required rows="3" value={form?.values?.description ?? lesson?.description ?? ''}></textarea></label>
 <label>Markdown file (optional, up to 256 KB)<input name="contentFile" type="file" accept=".md,text/markdown"/></label>
 <label>Lesson content (Markdown)<textarea name="content" rows="14" value={form?.values?.content ?? lesson?.content ?? ''}></textarea></label>
 <p class="hint">Enter lesson text or choose a .md file. A selected file replaces the text. File contents should contain the lesson body; enter its title and overview above.</p>
 <label>Video URL (optional)<input name="video_url" type="url" placeholder="https://example.com/lesson.mp4" value={form?.values?.video_url ?? lesson?.video_url ?? ''}/></label>
 <p class="hint">Use a direct, browser-playable video URL. This form saves a link rather than uploading a video file.</p>
 <label>Display order<input name="displayOrder" type="number" min="0" max="2147483647" step="1" value={form?.values?.displayOrder ?? lesson?.display_order ?? 0}/></label>
 <div class="actions"><button type="submit" disabled={phases.length === 0}>Save lesson</button><a href="/lessons">Cancel</a></div>
</form>
<p><a href="/lessons">Return to all lessons</a></p>
