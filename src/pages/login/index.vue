<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import type { FormState } from '#lib/form-types.js';

 import LandingPage from '#lib/LandingPage.vue';
 
 const { form } = defineProps<{ data: Record<string, any>; form?: FormState }>();
</script>

<template>
<LandingPage :loginForm="form" showLogin></LandingPage>
</template>

