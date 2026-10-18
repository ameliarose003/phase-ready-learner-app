<script lang="ts">
 import { page } from '$app/state';
</script>
<svelte:head><title>{page.status} | Phase Ready</title></svelte:head>
<h1>{page.status}</h1><p>{page.error?.message ?? 'Something went wrong. Please try again.'}</p><p><a href="/">Return home</a></p>
