<script lang="ts">
 import Icon from '#lib/Icon.svelte';
 import type { PageProps } from './$types';
 let { data }: PageProps = $props();
 import './page.css';
 import './theme.css';
 let menuOpen = $state(false);
 let category = $state('All pillars');
 let search = $state('');
 let saved = $state<string[]>([]);
 let modal = $state('');
 let dialog = $state<HTMLDialogElement>();
 let activePillar = $state<(typeof pillars)[number] | null>(null);
 let email = $state('');
 let newsletterPreview = $state(false);
 const categories = ['All pillars', 'Everyday essentials', 'Home & family', 'Personal readiness'];
 const pillars = [
  { title: 'Water', description: 'Build a reliable foundation, one drop at a time.', group: 'Everyday essentials', label: 'THE FOUNDATION', col: 0, row: 0, color: '#e4f0f2' },
  { title: 'Food', description: 'A practical pantry for the days that don’t go to plan.', group: 'Everyday essentials', label: 'EVERYDAY RESILIENCE', col: 1, row: 0, color: '#f5ecd4' },
  { title: 'Medical', description: 'Feel more confident caring for the people you love.', group: 'Everyday essentials', label: 'CARE & CONFIDENCE', col: 2, row: 0, color: '#f7e5df' },
  { title: 'Vehicle', description: 'Keep your next journey ready for the unexpected.', group: 'Home & family', label: 'READY TO GO', col: 3, row: 0, color: '#e4ebf1' },
  { title: 'Communications', description: 'Stay connected when it matters most.', group: 'Home & family', label: 'STAY CONNECTED', col: 4, row: 0, color: '#eae6f2' },
  { title: 'Security', description: 'A little peace of mind starts at home.', group: 'Home & family', label: 'PROTECT WHAT MATTERS', col: 0, row: 1, color: '#f5ecd4' },
  { title: 'Power', description: 'Keep the essentials running when the lights go out.', group: 'Everyday essentials', label: 'KEEP GOING', col: 1, row: 1, color: '#eae6f2' },
  { title: 'Individual', description: 'Invest in your skills, mindset, and wellbeing.', group: 'Personal readiness', label: 'START WITH YOU', col: 2, row: 1, color: '#e4f0f2' },
  { title: 'Shelter', description: 'Make a safe, comfortable place for your family.', group: 'Home & family', label: 'A PLACE TO FEEL SAFE', col: 3, row: 1, color: '#f7e5df' },
  { title: 'Beyond homesteading', description: 'Grow toward a more self-sufficient tomorrow.', group: 'Personal readiness', label: 'LOOKING AHEAD', col: 4, row: 1, color: '#e5eddf' }
 ];
 const stages = [
  { name: 'Lost', icon: 'compass', text: 'Finding your starting point.' },
  { name: 'Rookie', icon: 'bag', text: 'Learning the everyday basics.' },
  { name: 'Ready', icon: 'home', text: 'Building real confidence.' },
  { name: 'Pro', icon: 'gear', text: 'Growing your skills.' },
  { name: 'Jedi', icon: 'star', text: 'Ready to help others.' }
 ];
 const resources = [
  { icon: 'bag', title: 'Your first emergency kit', text: 'A simple place to start, without the overwhelm.', type: 'STARTER GUIDE', color: 'mint' },
  { icon: 'home', title: 'Family emergency plan', text: 'Bring everyone onto the same page.', type: 'PRINTABLE WORKSHEET', color: 'sand' },
  { icon: 'sun', title: 'Seasonal preparedness', text: 'Small reminders for the season you’re in.', type: 'SEASONAL COLLECTION', color: 'blue' }
 ];
 let filtered = $derived(pillars.filter(p => (category === 'All pillars' || p.group === category) && p.title.toLowerCase().includes(search.toLowerCase())));
 $effect(() => { if (modal && dialog && !dialog.open) dialog.showModal(); else if (!modal && dialog?.open) dialog.close(); });
 function toggleSave(title: string) { saved = saved.includes(title) ? saved.filter(s => s !== title) : [...saved, title]; }
 function openPreview(title: string) { activePillar = null; modal = title; menuOpen = false; }
 function closePreview() { modal = ''; activePillar = null; }
</script>

<svelte:head>
 <title>Phase Ready — Preparedness starts with you</title>
 <meta name="description" content="Build confidence, one practical step at a time. Explore the Phase Ready preparedness pillars and find your starting point." />
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>
<header class="header" id="top">
 <div class="nav-wrap">
  <a href="#top" class="brand" aria-label="Phase Ready home"><span class="brand-mark" aria-hidden="true"></span></a>
  <nav aria-label="Main navigation" class:mobile-open={menuOpen}>
   <a href="#pillars" onclick={() => menuOpen = false}>Explore the pillars</a>
   <a href="#system" onclick={() => menuOpen = false}>Our approach</a>
   <a href="#resources" onclick={() => menuOpen = false}>Resources</a>
   <a href="/phases">Take the course</a>
   <a class="nav-login" href={data.isLoggedIn ? '/dashboard' : '/login'}>{data.isLoggedIn ? 'Dashboard' : 'Log in'} <Icon name="arrow" size={16}/></a>
  </nav>
  <a class="button small nav-cta" href="#pillars">Find your starting point <Icon name="arrow" size={17}/></a>
  <button class="menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onclick={() => menuOpen = !menuOpen}><Icon name={menuOpen ? 'close' : 'menu'}/></button>
 </div>
</header>

<main id="main">
 <section class="hero">
  <div class="hero-inner">
   <div class="hero-copy">
    <div class="eyebrow light"><span class="tiny-star">✳</span> SMALL STEPS. STRONGER FAMILIES.</div>
    <h1>Emergency preparedness<br/><em>that meets you<br/>where you are.</em></h1>
    <p>You don’t need a bunker or a big budget. Just a starting point. Build the skills to care for your family, one practical step at a time.</p>
    <div class="hero-actions"><button class="button" onclick={() => openPreview('Find your starting point')}>Take the free assessment <Icon name="arrow" size={19}/></button><a class="text-link light" href="#system"><span class="play-circle"><Icon name="play" size={15}/></span> Meet Phase Ready</a></div>
    <div class="hero-reassurance"><span><Icon name="check" size={14}/> Free to explore</span><span><Icon name="check" size={14}/> Learn at your pace</span><span><Icon name="check" size={14}/> No fear. Just confidence.</span></div>
   </div>
   <div class="hero-visual">
    <div class="hero-photo" role="img" aria-label="Family looking over a mountain landscape together at sunset"></div>
   </div>
  </div>
  <div class="hero-bottom"><span>PREPAREDNESS FOR REAL LIFE</span><span>For your family.</span><span>For your neighbors.</span><span>For a stronger tomorrow.</span><Icon name="leaf" size={22}/></div>
 </section>

 <section id="system" class="section system">
  <div class="section-heading centered"><div class="eyebrow">A CLEAR PATH FORWARD</div><h2>The Phase Ready system</h2><p>Preparedness isn’t a finish line. Our five-phase approach helps<br class="desktop-break"/> you build confidence at every stage of the journey.</p></div>
  <div class="stage-track">{#each stages as stage, i}<div class="stage"><span class="stage-number">PHASE 0{i+1}</span><div class="stage-icon" class:highlight={i === 2}><Icon name={stage.icon} size={29}/></div><h3>{stage.name}</h3><p>{stage.text}</p></div>{/each}</div>
  <div class="system-note"><Icon name="shield" size={20}/><p>The goal is <strong>confidence.</strong> Practical, affordable preparedness for normal families.</p></div>
 </section>

 <section id="pillars" class="catalog section">
  <div class="section-heading catalog-heading"><div><div class="eyebrow">YOUR READINESS, YOUR WAY</div><h2>The <span class="red-text">10</span> preparedness <span class="blue-text">pillars</span></h2><p>Choose what matters to you today. Every pillar is open to explore.</p></div><span class="catalog-count"><Icon name="book" size={18}/> 10 pillars to discover</span></div>
  <div class="catalog-tools"><div class="filters" aria-label="Filter pillars">{#each categories as item}<button class:active={category === item} aria-pressed={category === item} onclick={() => category = item}>{item}</button>{/each}</div><label class="search"><Icon name="search" size={17}/><input aria-label="Search pillars" placeholder="Find a pillar..." bind:value={search}/></label></div>
  <div class="pillar-grid">{#each filtered as pillar}
   <article class="pillar-card">
    <button class="card-image" style={`--col:${pillar.col};--row:${pillar.row}`} aria-label={`Preview ${pillar.title}`} onclick={() => { activePillar = pillar; modal = pillar.title; }}><span class="pillar-number">{String(pillars.indexOf(pillar) + 1).padStart(2, '0')}</span></button>
    <button class="save-button" class:saved={saved.includes(pillar.title)} aria-label={`${saved.includes(pillar.title) ? 'Unsave' : 'Save'} ${pillar.title}`} aria-pressed={saved.includes(pillar.title)} onclick={() => toggleSave(pillar.title)}><Icon name="bookmark" size={17}/></button>
    <div class="card-body"><span class="card-label" style={`background:${pillar.color}`}>{pillar.label}</span><h3><button onclick={() => { activePillar = pillar; modal = pillar.title; }}>{pillar.title}</button></h3><p>{pillar.description}</p><div class="card-footer"><span><Icon name="book" size={15}/> Pillar overview</span><button aria-label={`Explore ${pillar.title}`} onclick={() => { activePillar = pillar; modal = pillar.title; }}><Icon name="arrow" size={18}/></button></div></div>
   </article>
  {/each}</div>
  {#if filtered.length === 0}<div class="empty-state"><Icon name="search" size={30}/><h3>No matching pillars</h3><p>Try another search or explore all ten pillars.</p><button class="button" onclick={() => { search = ''; category = 'All pillars'; }}>Show all pillars</button></div>{/if}
  <div class="catalog-bottom"><p><Icon name="compass" size={20}/> Not sure where to begin? We’ll help you find your first step.</p><button class="text-link" onclick={() => openPreview('Find your starting point')}>Find my starting point <Icon name="arrow" size={17}/></button></div>
 </section>

 <section class="purpose section"><div class="purpose-art"><div class="family-photo" role="img" aria-label="Family reading together beside a lantern"></div><div class="purpose-stamp"><Icon name="home" size={28}/><span>FOR THE PEOPLE<br/>YOU CALL HOME</span></div></div><div class="purpose-copy"><div class="eyebrow">PREPARED, NOT SCARED</div><h2>Real life happens.<br/>Let’s get ready for it.</h2><p>From a power outage to an unexpected detour, being prepared is about having options. And knowing you can take care of what matters most.</p><ul><li><Icon name="check"/> Practical steps that fit your everyday life</li><li><Icon name="check"/> A starting point for every experience level</li><li><Icon name="check"/> Room to learn, grow, and help your community</li></ul><a class="button dark" href="#pillars">Explore your first pillar <Icon name="arrow" size={18}/></a></div></section>

 <section id="resources" class="resources section"><div class="section-heading"><div class="eyebrow">A LITTLE HELP ALONG THE WAY</div><h2>Good tools. Small steps. Real progress.</h2><p>A place for the checklists, guides, and reminders that make readiness easier.</p></div><div class="resource-grid">{#each resources as resource}<button class={`resource-card ${resource.color}`} onclick={() => openPreview(resource.title)}><div class="resource-top"><span class="resource-icon"><Icon name={resource.icon} size={29}/></span><Icon name="arrow" size={22}/></div><span class="eyebrow">{resource.type}</span><h3>{resource.title}</h3><p>{resource.text}</p><span class="resource-link">Preview resource <Icon name="arrow" size={16}/></span></button>{/each}</div></section>

 <section class="newsletter"><div class="newsletter-inner"><div><div class="eyebrow light">BUILD A LITTLE CONFIDENCE EACH WEEK</div><h2>Your next small step,<br/><em>right in your inbox.</em></h2><p>Practical preparedness. No politics. No fear. Just one<br class="desktop-break"/> actionable thing your family can do this week.</p></div><div class="signup"><form onsubmit={(event) => { event.preventDefault(); newsletterPreview = true; }}><label for="email">A little more ready starts here.</label><div class="email-input"><input id="email" type="email" placeholder="Your email address" bind:value={email} required/><button class="button" type="submit">Keep me ready <Icon name="arrow" size={17}/></button></div><p><Icon name="shield" size={14}/> Design preview · No email is collected or sent.</p>{#if newsletterPreview}<div class="signup-feedback" role="status">You’ve previewed the sign-up flow. Subscriptions will be available when Phase Ready launches.</div>{/if}</form></div></div></section>
</main>

<footer class="footer"><div class="footer-main"><div class="footer-brand"><a href="#top" class="brand" aria-label="Phase Ready home"><span class="brand-mark" aria-hidden="true"></span></a><p>Emergency preparedness<br/>that meets you where you are.</p><span class="footer-tag"><Icon name="leaf" size={16}/> One step toward a stronger tomorrow.</span></div><div><h3>Explore</h3><a href="#pillars">The ten pillars</a><a href="#system">The Phase Ready system</a><button onclick={() => openPreview('Find your starting point')}>Readiness assessment</button></div><div><h3>Resources</h3><a href="#resources">Guides & checklists</a><button onclick={() => openPreview('The Phase Ready podcast')}>Podcast</button><a href="#resources">Seasonal preparedness</a></div><div><h3>Stay connected</h3><a href="#email">Weekly readiness notes</a><button onclick={() => openPreview('About Phase Ready')}>About Phase Ready</button><button onclick={() => openPreview('Get in touch')}>Get in touch</button></div></div><div class="footer-bottom"><span>© 2026 Phase Ready. All rights reserved.</span><span class="preview-badge">DESIGN PREVIEW</span><div><button onclick={() => openPreview('Privacy policy')}>Privacy</button><button onclick={() => openPreview('Terms of use')}>Terms</button></div></div></footer>

<dialog bind:this={dialog} class="preview-dialog" aria-labelledby="dialog-title" onclose={closePreview} oncancel={closePreview}>
 <div class="dialog-top"><span class="eyebrow">PHASE READY · DESIGN PREVIEW</span><button class="close-button" aria-label="Close preview" onclick={closePreview}><Icon name="close"/></button></div>
 {#if activePillar}<div class="dialog-image card-image" style={`--col:${activePillar.col};--row:${activePillar.row}`}></div>{:else}<div class="dialog-symbol"><Icon name={modal === 'Welcome back' ? 'user' : 'compass'} size={32}/></div>{/if}
 <h2 id="dialog-title">{modal}</h2>
 {#if activePillar}<p>{activePillar.description}</p><div class="preview-outline"><span class="eyebrow">PLANNED LEARNING EXPERIENCE</span>{#each ['Get oriented', 'Build your foundation', 'Make a practical plan', 'Put it into practice', 'Review your readiness'] as lesson, i}<div><span>0{i+1}</span><strong>{lesson}</strong><Icon name="book" size={17}/></div>{/each}</div>
 {:else if modal === 'Welcome back'}<p>Your readiness journey, all in one place.</p><a class="button dark" href="/login">Log in</a>
 {:else if modal === 'Find your starting point'}<p>Everyone starts somewhere. A short readiness check will help you understand where you are and choose a practical first step.</p><div class="assessment-preview"><span><Icon name="clock"/> At your own pace</span><span><Icon name="shield"/> Private by design</span></div><a class="button dark" href="#pillars" onclick={closePreview}>Explore the pillars for now <Icon name="arrow" size={18}/></a>
 {:else}<p>This space is reserved for {modal.toLowerCase()}. The final content and tools will be added as Phase Ready takes shape.</p><a class="button dark" href="#resources" onclick={closePreview}>Explore resources <Icon name="arrow" size={18}/></a>{/if}
 <p class="preview-notice">This resource is a preview. <a href="/phases">Visit the course</a> for published phases and lessons.</p>
</dialog>


