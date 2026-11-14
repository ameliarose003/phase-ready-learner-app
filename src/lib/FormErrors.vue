<script setup lang="ts">

 const { errors } = defineProps<{ errors?: Record<string, string> | null }>();
 const labels: Record<string, string> = { form: 'Notice', name: 'Name', email: 'Email', confirmEmail: 'Confirm email', password: 'Password', confirmPassword: 'Confirm password', role_name: 'Role', phaseId: 'Phase', title: 'Title', description: 'Overview', content: 'Lesson content', contentFile: 'Markdown file', video_url: 'Video URL', displayOrder: 'Display order', id: 'Phase' };
</script>

<template>
<template v-if="errors && Object.keys(errors).length"><div class="form-errors" role="alert"><p>Please check the following:</p><ul><template v-for="[field, message] in Object.entries(errors)"><li><strong>{{ labels[field] ?? field }}:</strong> {{ message }}</li></template></ul></div></template>
</template>

