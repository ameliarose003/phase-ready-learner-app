<script setup lang="ts">
import type { Component } from 'vue';
import type { FormState } from '#lib/form-types.js';
import SiteShell from '#lib/SiteShell.vue';
import './routes/portal.css';
defineProps<{
 component: Component; data: Record<string, any>; form?: FormState;
 page: {status: number; error: {message: string}};
}>();
</script>

<template>
 <template v-for="(messages, type) in data.flashMessages" :key="type">
  <div v-for="(message, index) in messages" :key="index" class="flash-message" :class="{error: type === 'error'}" :role="type === 'error' ? 'alert' : 'status'">
   <strong>{{ type }}:</strong> {{ message }}
  </div>
 </template>
 <SiteShell :data="data">
  <component :is="component" :data="data" :form="form" :page="page" />
 </SiteShell>
</template>

<style scoped>
.flash-message { padding: 1rem; background: #e4f0f2; color: #183c46; font-family: system-ui, sans-serif; }
.flash-message strong { text-transform: capitalize; }
.flash-message.error { background: #f7e5df; color: #752e29; }
</style>
