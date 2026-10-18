<script lang="ts">
 import LessonEditor from '#lib/LessonEditor.svelte';
 import type { PageProps } from './$types';
 let { data, form }: PageProps = $props();
</script>
<svelte:head><title>{data.lesson ? 'Edit lesson' : 'Add lesson'} | Phase Ready</title></svelte:head>
<LessonEditor phases={data.phases} lesson={data.lesson} {form}/>
