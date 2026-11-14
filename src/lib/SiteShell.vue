<script setup lang="ts">
import { ref, watchEffect } from 'vue';

 
 
 import Icon from '#lib/Icon.vue';
 import LoginModal from '#lib/LoginModal.vue';
 import '../routes/page.css';
 import '../routes/theme.css';
 const { data } = defineProps<{ data: Record<string, any>; }>();
 const menuOpen = ref(false);
 const loginOpen = ref(false);
 const modal = ref('');
 const dialog = ref<HTMLDialogElement>();
 watchEffect(() => { data.pathname; menuOpen.value = false; loginOpen.value = false; modal.value = ''; });
 function homeLink(fragment: string) { return data.pathname === '/' || data.pathname === '/login' ? fragment : '/' + fragment; }
 function openPreview(title: string) { modal.value = title; menuOpen.value = false; }
 function closePreview() { modal.value = ''; }
 watchEffect(() => { if (modal.value && dialog.value && !dialog.value.open) dialog.value.showModal(); else if (!modal.value && dialog.value?.open) dialog.value.close(); });
</script>

<template>
<a class="skip-link" href="#main">Skip to content</a>
<header class="header" id="top">
 <div class="nav-wrap">
  <a :href="homeLink('#top')" class="brand" aria-label="Phase Ready home"><span class="brand-mark" aria-hidden="true"></span></a>
  <nav aria-label="Main navigation" :class="{'mobile-open': (menuOpen)}">
   <a :href="homeLink('#pillars')" @click="() => menuOpen = false">Explore the pillars</a>
   <a :href="homeLink('#system')" @click="() => menuOpen = false">Our approach</a>
   <a :href="homeLink('#resources')" @click="() => menuOpen = false">Resources</a>
   <a href="/phases">Take the course</a>
   <a class="nav-login" :href="data.isLoggedIn ? (data.currentUser?.role_name === 'admin' ? '/admin' : '/dashboard') : '/login'" @click="(event: Event) => { if (!data.isLoggedIn) { event.preventDefault(); loginOpen = true; menuOpen = false; } }">{{ data.isLoggedIn ? 'Dashboard' : 'Log in' }} <Icon name="arrow" :size="16"></Icon></a>
   <template v-if="data.isLoggedIn"><a href="/logout" @click="() => menuOpen = false">Log out</a></template>
  </nav>
  <template v-if="!data.isLoggedIn"><a class="button small nav-cta" :href="homeLink('#pillars')">Find your starting point <Icon name="arrow" :size="17"></Icon></a></template>
  <button class="menu-toggle" :aria-label="menuOpen ? 'Close menu' : 'Open menu'" :aria-expanded="menuOpen" @click="() => menuOpen = !menuOpen"><Icon :name="menuOpen ? 'close' : 'menu'"></Icon></button>
 </div>
</header>


<main id="main" :class="{'portal': (!['/', '/login', '/signup'].includes(data.pathname))}"><slot /></main>

<footer class="footer">
 <div class="footer-main">
  <div class="footer-brand"><a :href="homeLink('#top')" class="brand" aria-label="Phase Ready home"><span class="brand-mark" aria-hidden="true"></span></a><p>Emergency preparedness<br />that meets you where you are.</p><span class="footer-tag"><Icon name="leaf" :size="16"></Icon> One step toward a stronger tomorrow.</span></div>
  <div><h3>Explore</h3><a :href="homeLink('#pillars')">The ten pillars</a><a :href="homeLink('#system')">The Phase Ready system</a><button @click="() => openPreview('Find your starting point')">Readiness assessment</button></div>
  <div><h3>Resources</h3><a :href="homeLink('#resources')">Guides & checklists</a><button @click="() => openPreview('The Phase Ready podcast')">Podcast</button><a :href="homeLink('#resources')">Seasonal preparedness</a></div>
  <div><h3>Stay connected</h3><a :href="homeLink('#email')">Weekly readiness notes</a><button @click="() => openPreview('About Phase Ready')">About Phase Ready</button><button @click="() => openPreview('Get in touch')">Get in touch</button></div>
 </div>
 <div class="footer-bottom"><span>© 2026 Phase Ready. All rights reserved.</span><span class="preview-badge">DESIGN PREVIEW</span><div><button @click="() => openPreview('Privacy policy')">Privacy</button><button @click="() => openPreview('Terms of use')">Terms</button></div></div>
</footer>

<dialog ref="dialog" class="preview-dialog" aria-labelledby="site-preview-title" @close="closePreview" @cancel="closePreview">
 <div class="dialog-top"><span class="eyebrow">PHASE READY · DESIGN PREVIEW</span><button class="close-button" aria-label="Close preview" @click="closePreview"><Icon name="close"></Icon></button></div>
 <div class="dialog-symbol"><Icon name="compass" :size="32"></Icon></div>
 <h2 id="site-preview-title">{{ modal }}</h2>
 <template v-if="modal === 'Find your starting point'">
  <p>Everyone starts somewhere. A short readiness check will help you understand where you are and choose a practical first step.</p>
  <div class="assessment-preview"><span><Icon name="clock"></Icon> At your own pace</span><span><Icon name="shield"></Icon> Private by design</span></div>
  <a class="button dark" :href="homeLink('#pillars')" @click="closePreview">Explore the pillars for now <Icon name="arrow" :size="18"></Icon></a>
 </template><template v-else>
  <p>This space is reserved for {{ modal.toLowerCase() }}. The final content and tools will be added as Phase Ready takes shape.</p>
  <a class="button dark" :href="homeLink('#resources')" @click="closePreview">Explore resources <Icon name="arrow" :size="18"></Icon></a>
 </template>
 <p class="preview-notice">This resource is a preview. <a href="/phases">Visit the course</a> for published phases and lessons.</p>
</dialog>
<template v-if="loginOpen"><LoginModal :form="null" :onDismiss="() => loginOpen = false"></LoginModal></template>
</template>

