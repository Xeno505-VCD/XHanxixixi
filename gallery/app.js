(() => {
  'use strict';

  const cards = [
    { id: 'leo-pizza', title: '狮子座生日披萨', mode: 'holo', src: '../output/leo-birthday-pizza/web/index.html?rev=20260915-transparent-canvas' },
    { id: 'eren', title: '艾伦少年 ⇄ 青年', mode: 'lenticular', src: '../output/eren-youth-adult-lenticular/web/index.html?rev=20260915-transparent-canvas' },
    { id: 'jotaro', title: '承太郎四景', mode: 'lenticular', src: '../output/jotaro-four-view-lenticular/web/index.html?rev=20260915-transparent-canvas' },
    { id: 'tokyo-ghoul', title: '东京喰种三相', mode: 'lenticular', src: '../output/tokyo-ghoul-triad-lenticular/web/index.html?rev=20260915-transparent-canvas' },
    { id: 'gojo-geto', title: '五条 ⇄ 夏油', mode: 'lenticular', src: '../output/gojo-geto-lenticular/web/index.html?rev=20260915-transparent-canvas' },
    { id: 'giyu-muichiro', title: '义勇 ⇄ 无一郎', mode: 'lenticular', src: '../output/giyu-muichiro-lenticular/web/index.html?rev=20260915-transparent-canvas' },
    { id: 'tanjiro', title: '炭治郎三息', mode: 'lenticular', src: '../output/tanjiro-triad-lenticular/web/index.html?rev=20260915-transparent-canvas' },
    { id: 'zenitsu', title: '善逸', mode: 'holo', src: '../output/zenitsu-thunderclap-holo/web/index.html?rev=20260915-transparent-canvas' },
    { id: 'inosuke', title: '伊之助', mode: 'holo', src: '../output/inosuke-ruic-holo/web/index.html?rev=20260915-transparent-canvas' },
    { id: 'kanao', title: '香奈乎', mode: 'holo', src: '../output/kanao-flower-breathing-holo/web/index.html?rev=20260915-transparent-canvas' },
    { id: 'nezuko', title: '祢豆子', mode: 'holo', src: '../output/nezuko-blood-moon-holo/web/index.html?rev=20260915-transparent-canvas' },
    { id: 'purple-lightning-moon', title: '紫电·月影', mode: 'holo', src: '../output/purple-lightning-moon-holo/web/index.html?rev=20260915-transparent-canvas' },
    { id: 'zhongli', title: '钟离', mode: 'holo', src: '../output/zhongli-geo-holo/web/index.html?rev=20260915-transparent-canvas' },
  ];

  const frame = document.querySelector('#card-frame');
  const loading = document.querySelector('#frame-loading');
  const title = document.querySelector('#card-name');
  const position = document.querySelector('#card-position');
  const previous = document.querySelector('#previous');
  const next = document.querySelector('#next');
  let activeIndex = 0;
  let touchStart = null;

  const wrapIndex = (index) => (index % cards.length + cards.length) % cards.length;

  const indexFromUrl = () => {
    const id = new URLSearchParams(window.location.search).get('card');
    const index = cards.findIndex((card) => card.id === id);
    return index >= 0 ? index : 0;
  };

  const updateUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('card', cards[activeIndex].id);
    window.history.replaceState(null, '', url);
  };

  const attachFrameNavigation = () => {
    const frameDocument = frame.contentDocument;
    if (!frameDocument || !window.matchMedia('(pointer: coarse)').matches) return;

    frameDocument.addEventListener('pointerdown', (event) => {
      if (event.target.closest('button, input, select, textarea, a, dialog')) {
        touchStart = null;
        return;
      }
      touchStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    }, true);

    frameDocument.addEventListener('pointerup', (event) => {
      if (!touchStart || touchStart.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - touchStart.x;
      const deltaY = event.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(deltaX) < 72 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return;
      goTo(activeIndex + (deltaX < 0 ? 1 : -1));
    }, true);

    frameDocument.addEventListener('keydown', (event) => {
      if (!event.altKey) return;
      if (event.key === 'ArrowLeft') goTo(activeIndex - 1);
      if (event.key === 'ArrowRight') goTo(activeIndex + 1);
    }, true);
  };

  const applyFrameShowcase = () => {
    const frameDocument = frame.contentDocument;
    const card = cards[activeIndex];
    if (!frameDocument || !card) return Promise.resolve();
    frameDocument.documentElement.classList.add('showcase-card');
    if (frameDocument.querySelector('[data-gallery-showcase]')) return Promise.resolve();
    const stylesheet = frameDocument.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL(`./showcase-${card.mode}.css?rev=20260914-transparent-canvas`, window.location.href).href;
    stylesheet.dataset.galleryShowcase = '';
    return new Promise((resolve) => {
      let finished = false;
      const revealWhenReady = () => {
        if (finished) return;
        finished = true;
        requestAnimationFrame(resolve);
      };
      stylesheet.addEventListener('load', revealWhenReady, { once: true });
      stylesheet.addEventListener('error', revealWhenReady, { once: true });
      window.setTimeout(revealWhenReady, 600);
      frameDocument.head.append(stylesheet);
    });
  };

  const waitForCardRender = () => new Promise((resolve) => {
    const deadline = performance.now() + 5000;
    const check = () => {
      const frameDocument = frame.contentDocument;
      if (frameDocument && !frameDocument.querySelector('#loading')) {
        resolve();
        return;
      }
      if (performance.now() >= deadline) {
        resolve();
        return;
      }
      window.setTimeout(check, 80);
    };
    check();
  });

  const prepareLeoEntrance = () => new Promise((resolve) => {
    if (cards[activeIndex]?.id !== 'leo-pizza') {
      resolve(null);
      return;
    }

    const deadline = performance.now() + 3600;
    const waitForCard = () => {
      if (cards[activeIndex]?.id !== 'leo-pizza') {
        resolve(null);
        return;
      }
      const holo = frame.contentWindow?.__holo;
      if (holo?.ready && typeof holo.flip === 'function') {
        holo.flip(true);
        window.setTimeout(() => resolve(() => holo.flip(false)), 680);
        return;
      }
      if (performance.now() >= deadline) {
        resolve(null);
        return;
      }
      window.setTimeout(waitForCard, 80);
    };
    waitForCard();
  });

  const goTo = (requestedIndex) => {
    activeIndex = wrapIndex(requestedIndex);
    const card = cards[activeIndex];
    touchStart = null;
    title.textContent = card.title;
    position.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    document.documentElement.dataset.cardMode = card.mode;
    frame.title = `${card.title} 卡片`;
    previous.disabled = false;
    next.disabled = false;
    frame.classList.remove('is-ready');
    loading.classList.remove('is-hidden');
    updateUrl();
    frame.src = card.src;
  };

  previous.addEventListener('click', () => goTo(activeIndex - 1));
  next.addEventListener('click', () => goTo(activeIndex + 1));
  frame.addEventListener('load', async () => {
    await applyFrameShowcase();
    await waitForCardRender();
    const revealLeoFront = await prepareLeoEntrance();
    frame.classList.add('is-ready');
    loading.classList.add('is-hidden');
    attachFrameNavigation();
    if (revealLeoFront) window.setTimeout(revealLeoFront, 420);
  });

  window.addEventListener('keydown', (event) => {
    if (!event.altKey) return;
    if (event.key === 'ArrowLeft') goTo(activeIndex - 1);
    if (event.key === 'ArrowRight') goTo(activeIndex + 1);
  });

  goTo(indexFromUrl());
})();
