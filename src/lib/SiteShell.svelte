<script lang="ts">
 import type { Snippet } from 'svelte';
 import type { LayoutData } from '../routes/$types';
 import Icon from '#lib/Icon.svelte';
 import LoginModal from '#lib/LoginModal.svelte';
 import '../routes/page.css';
 import '../routes/theme.css';
 let { data, children }: { data: LayoutData; children: Snippet } = $props();
 let menuOpen = $state(false);
 let loginOpen = $state(false);
 let modal = $state('');
 let dialog = $state<HTMLDialogElement>();
 $effect(() => { data.pathname; menuOpen = false; loginOpen = false; modal = ''; });
 function homeLink(fragment: string) { return data.pathname === '/' || data.pathname === '/login' ? fragment : '/' + fragment; }
 function openPreview(title: string) { modal = title; menuOpen = false; }
 function closePreview() { modal = ''; }
 $effect(() => { if (modal && dialog && !dialog.open) dialog.showModal(); else if (!modal && dialog?.open) dialog.close(); });
</script>

<a class="skip-link" href="#main">Skip to content</a>
<header class="header" id="top">
 <div class="nav-wrap">
  <a href={homeLink('#top')} class="brand" aria-label="Phase Ready home"><span class="brand-mark" aria-hidden="true"></span></a>
  <nav aria-label="Main navigation" class:mobile-open={menuOpen}>
   <a href={homeLink('#pillars')} onclick={() => menuOpen = false}>Explore the pillars</a>
   <a href={homeLink('#system')} onclick={() => menuOpen = false}>Our approach</a>
   <a href={homeLink('#resources')} onclick={() => menuOpen = false}>Resources</a>
   <a href="/phases">Take the course</a>
   <a class="nav-login" href={data.isLoggedIn ? (data.currentUser?.role_name === 'admin' ? '/admin' : '/dashboard') : '/login'} onclick={(event) => { if (!data.isLoggedIn) { event.preventDefault(); loginOpen = true; menuOpen = false; } }}>{data.isLoggedIn ? 'Dashboard' : 'Log in'} <Icon name="arrow" size={16}/></a>
   {#if data.isLoggedIn}<a href="/logout" onclick={() => menuOpen = false}>Log out</a>{/if}
  </nav>
  {#if !data.isLoggedIn}<a class="button small nav-cta" href={homeLink('#pillars')}>Find your starting point <Icon name="arrow" size={17}/></a>{/if}
  <button class="menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onclick={() => menuOpen = !menuOpen}><Icon name={menuOpen ? 'close' : 'menu'}/></button>
 </div>
</header>


<main id="main" class:portal={!['/', '/login', '/signup'].includes(data.pathname)}>{@render children()}</main>

<footer class="footer">
 <div class="footer-main">
  <div class="footer-brand"><a href={homeLink('#top')} class="brand" aria-label="Phase Ready home"><span class="brand-mark" aria-hidden="true"></span></a><p>Emergency preparedness<br/>that meets you where you are.</p><span class="footer-tag"><Icon name="leaf" size={16}/> One step toward a stronger tomorrow.</span></div>
  <div><h3>Explore</h3><a href={homeLink('#pillars')}>The ten pillars</a><a href={homeLink('#system')}>The Phase Ready system</a><button onclick={() => openPreview('Find your starting point')}>Readiness assessment</button></div>
  <div><h3>Resources</h3><a href={homeLink('#resources')}>Guides & checklists</a><button onclick={() => openPreview('The Phase Ready podcast')}>Podcast</button><a href={homeLink('#resources')}>Seasonal preparedness</a></div>
  <div><h3>Stay connected</h3><a href={homeLink('#email')}>Weekly readiness notes</a><button onclick={() => openPreview('About Phase Ready')}>About Phase Ready</button><button onclick={() => openPreview('Get in touch')}>Get in touch</button></div>
 </div>
 <div class="footer-bottom"><span>© 2026 Phase Ready. All rights reserved.</span><span class="preview-badge">DESIGN PREVIEW</span><div><button onclick={() => openPreview('Privacy policy')}>Privacy</button><button onclick={() => openPreview('Terms of use')}>Terms</button></div></div>
</footer>

<dialog bind:this={dialog} class="preview-dialog" aria-labelledby="site-preview-title" onclose={closePreview} oncancel={closePreview}>
 <div class="dialog-top"><span class="eyebrow">PHASE READY · DESIGN PREVIEW</span><button class="close-button" aria-label="Close preview" onclick={closePreview}><Icon name="close"/></button></div>
 <div class="dialog-symbol"><Icon name="compass" size={32}/></div>
 <h2 id="site-preview-title">{modal}</h2>
 {#if modal === 'Find your starting point'}
  <p>Everyone starts somewhere. A short readiness check will help you understand where you are and choose a practical first step.</p>
  <div class="assessment-preview"><span><Icon name="clock"/> At your own pace</span><span><Icon name="shield"/> Private by design</span></div>
  <a class="button dark" href={homeLink('#pillars')} onclick={closePreview}>Explore the pillars for now <Icon name="arrow" size={18}/></a>
 {:else}
  <p>This space is reserved for {modal.toLowerCase()}. The final content and tools will be added as Phase Ready takes shape.</p>
  <a class="button dark" href={homeLink('#resources')} onclick={closePreview}>Explore resources <Icon name="arrow" size={18}/></a>
 {/if}
 <p class="preview-notice">This resource is a preview. <a href="/phases">Visit the course</a> for published phases and lessons.</p>
</dialog>
{#if loginOpen}<LoginModal form={null} onDismiss={() => loginOpen = false}/>{/if}
