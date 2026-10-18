<script lang="ts">
 import AccountEditor from '#lib/AccountEditor.svelte';
 import type { PageProps } from './$types';
 let { data, form }: PageProps = $props();
</script>
<svelte:head><title>Edit account | Phase Ready</title></svelte:head>
<AccountEditor user={data.user} canEditRole={data.canEditRole} cancelHref={data.cancelHref} {form}/>
