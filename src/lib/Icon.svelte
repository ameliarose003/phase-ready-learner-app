<script lang="ts">
 let { name = 'arrow', size = 22 }: { name?: string; size?: number } = $props();
 const paths: Record<string, string> = {
  arrow: 'M5 12h14m-6-6 6 6-6 6', chevron: 'm9 5 7 7-7 7', check: 'm5 12 4 4L19 6',
  shield: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Z M8 12l3 3 5-6',
  book: 'M12 6v15M12 6C8 3 4 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-2-1-6-1-10 2Z',
  bookmark: 'M6 3h12v18l-6-4-6 4V3Z', clock: 'M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  play: 'm9 6 9 6-9 6V6Z', menu: 'M4 6h16M4 12h16M4 18h16', close: 'm6 6 12 12M6 18 18 6',
  compass: 'm16 8-3 5-5 3 3-5 5-3Z M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  bag: 'M6 7h12l2 14H4L6 7Z M9 7V5a3 3 0 0 1 6 0v2 M8 12h8',
  home: 'm3 11 9-8 9 8M5 9v12h14V9M9 21v-7h6v7', gear: 'M12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8 2 2M6 18l2-2m8-8 2-2 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  star: 'm12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1 3-7Z',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', mail: 'M3 5h18v14H3V5Z m0 0 9 8 9-8',
  search: 'M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z', leaf: 'M4 20C1 10 8 3 21 3c0 13-7 20-17 17Zm0 0L16 8',
  drop: 'M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13Z', user: 'M5 21v-2a7 7 0 0 1 14 0v2 M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'
 };
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={paths[name] || paths.arrow} /></svg>
