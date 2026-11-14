<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { usePageHead } from '#lib/page.js';
usePageHead(() => ({ title: "Log out | Phase Ready" }));
</script>

<template>
<h1>Log out</h1><p>Ready to finish for now?</p><form method="POST"><button type="submit">Log out</button></form><p><a href="/dashboard">Keep learning</a></p>
</template>

