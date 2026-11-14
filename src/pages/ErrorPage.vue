<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { usePageHead } from '#lib/page.js';

 const { page } = defineProps<{page: {status: number; error: {message: string}}}>();
usePageHead(() => ({ title: (page.status) + " | Phase Ready" }));
</script>

<template>
<h1>{{ page.status }}</h1><p>{{ page.error?.message ?? 'Something went wrong. Please try again.' }}</p><p><a href="/">Return home</a></p>
</template>

