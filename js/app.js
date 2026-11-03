/* Navigation, galleries, honest email handoff and the full-screen logo intro. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let locale = 'en';
  let activeGallery = null, imageIndex = 0, galleryTrigger = null;
  let finishIntro = () => {};
  let cleanupPage = () => {};
  try { locale = new URLSearchParams(location.search).get('reviewLocale') || 'en'; } catch {}
  if (!['ar','en'].includes(locale)) locale = 'en';
  const $ = s => document.querySelector(s);
  const content = () => window.QOUMRA_CONTENT[locale];
  const root = $('#site-root');

  function render(nextLocale, initial = false) {
    finishIntro();
    cleanupPage();
    const oldScroll = window.scrollY;
    const previousForm = document.querySelector('#inquiry-form');
    const draft = previousForm ? Object.fromEntries(new FormData(previousForm)) : null;
    locale = nextLocale;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    root.innerHTML = window.QoumraRender(locale);
    document.title = content().metadata.title;
    $('meta[name="description"]').content = content().metadata.description;
    wirePage();
    if (draft) for (const [name,value] of Object.entries(draft)) { const field=$('#inquiry-form').elements.namedItem(name); if(field) field.value=value; }
    if (!initial) {
      try { const url = new URL(location.href); url.searchParams.set('reviewLocale',locale); history.replaceState({},'',url); } catch {}
      window.scrollTo({top:oldScroll,behavior:'instant'});
      $('.language-switch').focus({preventScroll:true});
    }
  }

  function closeMenu() { const menu=$('#mobile-menu'); if(menu.open) menu.close(); $('.menu-toggle').setAttribute('aria-expanded','false'); }
  function showImage() {
    const index = window.QOUMRA_CONFIG.galleries.indexOf(activeGallery);
    const image=$('#gallery-image');
    image.src=activeGallery.images[imageIndex];
    image.alt=content().galleryTitles[index]+' — '+(activeGallery.isPlaceholder?content().ui.placeholder+' ':'')+(imageIndex+1);
    $('#gallery-label').textContent=content().galleryTitles[index];
    $('#gallery-count').textContent=`${imageIndex+1} ${content().ui.counter} ${activeGallery.images.length}`;
  }
  function moveImage(delta) { imageIndex=(imageIndex+delta+activeGallery.images.length)%activeGallery.images.length;showImage(); }

  function wirePage() {
    const menu=$('#mobile-menu'),gallery=$('#gallery-dialog'),privacy=$('#privacy-dialog');
    const cleanup=[];
    document.querySelectorAll('[data-find-service]').forEach(button=>button.addEventListener('click',()=>{
      const service=content().services.find(item=>item.id===button.dataset.findService);
      document.querySelectorAll('[data-find-service]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      $('#finder-title').textContent=service.title;$('#finder-description').textContent=service.description;$('#finder-link').href='#'+service.id;
      $('#inquiry-form').elements.service.value=service.id;
    }));
    $('.menu-toggle').addEventListener('click',()=>{finishIntro();menu.showModal();$('.menu-toggle').setAttribute('aria-expanded','true');});
    $('[data-close-menu]').addEventListener('click',closeMenu);
    menu.addEventListener('close',()=>$('.menu-toggle').setAttribute('aria-expanded','false'));
    menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
    $('.language-switch').addEventListener('click',e=>render(e.currentTarget.dataset.locale));
    $('[data-close-gallery]').addEventListener('click',()=>gallery.close());
    $('[data-gallery-prev]').addEventListener('click',()=>moveImage(-1));
    $('[data-gallery-next]').addEventListener('click',()=>moveImage(1));
    gallery.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();moveImage(1);}if(e.key==='ArrowLeft'){e.preventDefault();moveImage(-1);}});
    gallery.addEventListener('close',()=>galleryTrigger?.focus({preventScroll:true}));
    [gallery,privacy].forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}}));
    document.querySelectorAll('[data-gallery]').forEach(button=>button.addEventListener('click',e=>{
      e.preventDefault();galleryTrigger=button;activeGallery=window.QOUMRA_CONFIG.galleries.find(g=>g.id===button.dataset.gallery);imageIndex=Number(button.dataset.index);showImage();gallery.showModal();
    }));
    document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
      document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      document.querySelectorAll('[data-work-group]').forEach(group=>group.hidden=button.dataset.filter!=='all'&&button.dataset.filter!==group.dataset.workGroup);
    }));
    document.querySelectorAll('[data-service],[data-package]').forEach(link=>link.addEventListener('click',()=>{
      const form=$('#inquiry-form');if(link.dataset.service)form.elements.service.value=link.dataset.service;if(link.dataset.package)form.elements.package.value=link.dataset.package;
    }));
    const params=new URLSearchParams(location.search),form=$('#inquiry-form');
    for(const name of ['service','package'])if([...form.elements[name].options].some(o=>o.value===params.get(name)))form.elements[name].value=params.get(name);
    form.addEventListener('input',()=>{form.elements.email.setCustomValidity('');form.elements.phone.setCustomValidity('');});
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const email=window.QOUMRA_CONFIG.contact.email;
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
      const emailField=form.elements.email,phoneField=form.elements.phone;
      emailField.setCustomValidity(!emailField.value.trim()&&!phoneField.value.trim()?content().contact.errors.contact:'');
      phoneField.setCustomValidity(phoneField.value.trim()&&(!/^\+?[\d\s().-]{7,40}$/.test(phoneField.value.trim())||phoneField.value.replace(/\D/g,'').length<7||phoneField.value.replace(/\D/g,'').length>15)?content().contact.errors.phone:'');
      if(!form.reportValidity())return;
      const f=form.elements,c=content(),service=c.services.find(s=>s.id===f.service.value)?.title||'',pack=c.packages.find(p=>p.id===f.package.value)?.title||'';
      const body=[`${c.contact.fields.name}: ${f.name.value.trim()}`,`${c.contact.fields.email}: ${f.email.value.trim()}`,`${c.contact.fields.phone}: ${f.phone.value.trim()}`,`${c.contact.fields.company}: ${f.company.value.trim()}`,`${c.contact.fields.service}: ${service}`,`${c.contact.fields.package}: ${pack}`,'',f.message.value.trim()].join('\n');
      const url='mailto:'+email+'?subject='+encodeURIComponent('Qoumra inquiry — '+f.name.value.trim())+'&body='+encodeURIComponent(body);
      window.location.href=url;$('#form-status').textContent=c.ui.formReady;
    });
    $('[data-open-privacy]').addEventListener('click',()=>privacy.showModal());
    $('[data-close-privacy]').addEventListener('click',()=>privacy.close());
    cleanup.push(setupVideos());
    cleanup.push(setupScrollReveal());
    const navLinks=[...document.querySelectorAll('.desktop-nav a,.mobile-panel nav a')];
    const markNav=id=>navLinks.forEach(link=>{if(link.getAttribute('href')==='#'+id)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    const hashId=location.hash.slice(1);markNav(['ai','creative','web','growth'].includes(hashId)?'services':hashId||'home');
    if('IntersectionObserver' in window){
      const navObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)markNav(entry.target.id);},{rootMargin:'-15% 0px -65% 0px',threshold:0});
      for(const id of ['home','services','portfolio','packages','about','contact'])navObserver.observe(document.getElementById(id));
      cleanup.push(()=>navObserver.disconnect());
    }
    cleanupPage=()=>cleanup.forEach(fn=>fn());
  }

  // Muted inline playback is attempted only while the preview is visible.
  // A user's pause choice survives scrolling, tab switching and motion settings.
  function setupVideos(){
    const records=[];
    let destroyed=false;
    const autoAllowed=()=>!reduced.matches&&!navigator.connection?.saveData;
    const sync=record=>{
      const playing=!record.video.paused&&!record.video.ended;
      record.video.dataset.playback=playing?'playing':'paused';
      record.video.setAttribute('aria-label',(playing?content().ui.pause:content().ui.play)+' — '+record.title);
      record.video.setAttribute('aria-pressed',String(playing));
    };
    const tryPlay=record=>{
      if(destroyed||!record.visible||document.hidden||record.userPaused||record.blocked||(!autoAllowed()&&!record.userStarted))return;
      record.video.play().catch(error=>{if(!destroyed){if(error.name!=='AbortError')record.blocked=true;sync(record);}});
    };
    const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
      entries.forEach(entry=>{const r=records.find(item=>item.video===entry.target);if(!r)return;r.visible=entry.isIntersecting&&entry.intersectionRatio>=.25;if(r.visible)tryPlay(r);else r.video.pause();});
    },{threshold:[0,.25]}):null;
    document.querySelectorAll('video').forEach(video=>{
      const record={video,title:video.getAttribute('aria-label'),visible:false,userPaused:false,userStarted:false,blocked:false};
      records.push(record);video.autoplay=false;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.controls=false;video.pause();
      const toggle=()=>{if(video.paused){record.userPaused=false;record.userStarted=true;record.blocked=false;record.visible=true;tryPlay(record);}else{record.userPaused=true;record.userStarted=false;video.pause();}sync(record);};
      video.addEventListener('click',toggle);
      video.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}});
      video.addEventListener('play',()=>sync(record));video.addEventListener('pause',()=>sync(record));
      video.addEventListener('error',()=>{record.blocked=true;video.poster=window.QOUMRA_CONFIG.media[video.id.replace('film-','')].poster;},{once:true});
      sync(record);observer?.observe(video);
    });
    const visibility=()=>records.forEach(r=>{if(document.hidden)r.video.pause();else tryPlay(r);});
    const motion=()=>records.forEach(r=>{if(!autoAllowed()&&!r.userStarted)r.video.pause();else tryPlay(r);});
    document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motion);
    return()=>{destroyed=true;observer?.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motion);records.forEach(r=>r.video.pause());};
  }

  // Content is visible without JavaScript. Re-entering from either edge replays
  // a small fade/slide; no hidden layout, scroll hijacking, or pinned text.
  function setupScrollReveal() {
    if (reduced.matches || !('IntersectionObserver' in window)) return () => {};
    const selector = [
      '.introduction > .eyebrow', '.section-intro > *', '.finder-choices button',
      '.finder-result', '.finder-hint', '.section-heading > *', '.service-heading > *',
      '.service-details details', '.service-cta', '.portfolio-category > *',
      '.portfolio-filters', '.gallery-card', '.example-card', '.package-row',
      '.about-grid > div:last-child > *', '.process-section > .eyebrow',
      '.process-section > h2', '.process-steps li', '.contact-grid > div:first-child',
      '#inquiry-form', '.footer-main > *'
    ].join(',');
    const elements = [...document.querySelectorAll(selector)];
    const setState = (element, visible, above) => {
      element.classList.toggle('is-visible', visible);
      element.classList.toggle('reveal-from-top', !visible && above);
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        setState(entry.target, entry.isIntersecting, entry.boundingClientRect.bottom <= 0);
      }
    }, {rootMargin:'0px 0px -32px 0px', threshold:0});
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      setState(element, rect.bottom > 0 && rect.top < window.innerHeight - 32, rect.bottom <= 0);
      element.classList.add('scroll-reveal');
      observer.observe(element);
    }
    return () => { observer.disconnect();elements.forEach(e=>e.classList.remove('scroll-reveal','is-visible','reveal-from-top')); };
  }

  async function intro() {
    if (reduced.matches || location.hash || window.scrollY>40) return;
    const stage=$('#intro-stage'),word=$('#intro-word'),header=$('.header-logo img'),backdrop=$('.intro-backdrop');
    let ended=false,wordAnimation,fadeAnimation;
    const stop = () => {
      if(ended)return;ended=true;
      stage.hidden=true;document.body.classList.remove('intro-active');
      wordAnimation?.cancel();fadeAnimation?.cancel();
      window.removeEventListener('resize',stop);window.removeEventListener('orientationchange',stop);window.removeEventListener('scroll',stop);
      reduced.removeEventListener('change',stop);
      $('#site-root').removeAttribute('aria-busy');
    };
    finishIntro=stop;
    try {
      await Promise.race([word.decode(),new Promise(resolve=>setTimeout(resolve,400))]);
      if(ended)return;
      const target=header.getBoundingClientRect();
      const vw=document.documentElement.clientWidth,vh=window.innerHeight;
      const width=Math.min(vw*.88,1100,vh*2.8),height=width*303/1262;
      stage.hidden=false;word.style.visibility='hidden';word.style.left='0px';word.style.top='0px';word.style.transform='none';
      const fixedOrigin=word.getBoundingClientRect();
      const baseLeft=target.left-fixedOrigin.left,baseTop=target.top-fixedOrigin.top;
      word.style.width=target.width+'px';word.style.left=baseLeft+'px';word.style.top=baseTop+'px';
      const start=`translate(${(vw-width)/2-baseLeft}px,${(vh-height)/2-baseTop}px) scale(${width/target.width})`;
      word.style.transform=start;word.style.visibility='';document.body.classList.add('intro-active');
      $('#site-root').setAttribute('aria-busy','true');
      $('#skip-intro').addEventListener('click',stop,{once:true});
      window.addEventListener('resize',stop,{once:true});window.addEventListener('orientationchange',stop,{once:true});window.addEventListener('scroll',stop,{once:true});reduced.addEventListener('change',stop,{once:true});
      wordAnimation=word.animate([{transform:start,offset:0},{transform:start,offset:.36},{transform:'translate(0,0) scale(1)',offset:1}],{duration:1850,easing:'cubic-bezier(.65,0,.2,1)',fill:'forwards'});
      fadeAnimation=backdrop.animate([{opacity:1,offset:0},{opacity:1,offset:.35},{opacity:0,offset:1}],{duration:1850,easing:'ease',fill:'forwards'});
      await wordAnimation.finished;stop();
    }catch{stop();}
  }
  render(locale,true);
  window.addEventListener('hashchange',()=>{const active=['#ai','#creative','#web','#growth'].includes(location.hash)?'#services':location.hash;document.querySelectorAll('.desktop-nav a,.mobile-panel nav a').forEach(a=>{if(a.getAttribute('href')===active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});});
  window.addEventListener('scroll',()=>$('.site-header')?.classList.toggle('scrolled',window.scrollY>20),{passive:true});
  window.addEventListener('resize',()=>{if(window.innerWidth>1000)closeMenu();},{passive:true});
  if (location.hash) requestAnimationFrame(()=>{try{document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({behavior:'instant'});}catch{}});
  if(new URLSearchParams(location.search).get('reviewView')==='privacy')$('#privacy-dialog').showModal();
  intro();
})();
