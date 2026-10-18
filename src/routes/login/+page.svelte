<script lang="ts">
 import LandingPage from '#lib/LandingPage.svelte';
 import type { PageProps } from './$types';
 let { form }: PageProps = $props();
</script>
<LandingPage loginForm={form} showLogin/>
