<script lang="ts">
 let { errors }: { errors?: Record<string, string> | null } = $props();
 const labels: Record<string, string> = { form: 'Notice', name: 'Name', email: 'Email', confirmEmail: 'Confirm email', password: 'Password', confirmPassword: 'Confirm password', role_name: 'Role', phaseId: 'Phase', title: 'Title', description: 'Overview', content: 'Lesson content', contentFile: 'Markdown file', video_url: 'Video URL', displayOrder: 'Display order', id: 'Phase' };
</script>
{#if errors && Object.keys(errors).length}<div class="form-errors" role="alert"><p>Please check the following:</p><ul>{#each Object.entries(errors) as [field, message]}<li><strong>{labels[field] ?? field}:</strong> {message}</li>{/each}</ul></div>{/if}
