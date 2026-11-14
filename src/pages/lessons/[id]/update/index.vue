<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { usePageHead } from '#lib/page.js';
import type { FormState } from '#lib/form-types.js';

 import LessonEditor from '#lib/LessonEditor.vue';
 
 const { data, form } = defineProps<{ data: Record<string, any>; form?: FormState }>();
usePageHead(() => ({ title: (data.lesson ? 'Edit lesson' : 'Add lesson') + " | Phase Ready" }));
</script>

<template>
<LessonEditor :phases="data.phases" :lesson="data.lesson" :form="form"></LessonEditor>
</template>

