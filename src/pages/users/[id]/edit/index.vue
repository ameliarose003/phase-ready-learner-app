<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { usePageHead } from '#lib/page.js';
import type { FormState } from '#lib/form-types.js';

 import AccountEditor from '#lib/AccountEditor.vue';
 
 const { data, form } = defineProps<{ data: Record<string, any>; form?: FormState }>();
usePageHead(() => ({ title: "Edit account | Phase Ready" }));
</script>

<template>
<AccountEditor :user="data.user" :canEditRole="data.canEditRole" :cancelHref="data.cancelHref" :form="form"></AccountEditor>
</template>

