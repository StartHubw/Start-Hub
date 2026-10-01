/* ==========================================================================
   StartHUB — animações clean
   Um único arquivo: ele injeta o próprio CSS das animações, então não precisa
   mexer no style.css. Funciona em todas as páginas (index, sites, videos, design).

   Como usar: no <head> de cada página, DEPOIS do <link> do style.css:
   <script src="script.js"></script>
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  /* Elementos que aparecem com fade + slide ao entrar na tela */
  const REVEAL = [
    '#discord > h4',
    '#discordlogo',
    '#titulo',
    '#somos',
    '.card-container',
    '.nada',
  ];

  /* ------------------------------------------------------------------------
     1. CSS injetado (executa já no <head>, antes do primeiro desenho da página)
     ------------------------------------------------------------------------ */
  if (!reduceMotion) root.classList.add('sh-js');

  const css = `
    html { scroll-behavior: smooth; }
    #quem-somos, #projetos, #participantes { scroll-margin-top: 110px; }

    /* Barra de progresso de rolagem */
    .sh-progress {
      position: fixed; top: 0; left: 0; width: 100%; height: 3px;
      z-index: 2001; pointer-events: none;
      transform: scaleX(0); transform-origin: left; will-change: transform;
      background: linear-gradient(90deg, var(--roxo, #6D28D9), var(--lavanda, #A78BFA));
    }

    /* Navbar: vira vidro fosco ao rolar */
    body .navbar {
      -webkit-backdrop-filter: blur(0px); backdrop-filter: blur(0px);
      transition: background-color .4s ease, box-shadow .4s ease,
                  border-color .4s ease, backdrop-filter .4s ease;
    }
    body .navbar.sh-scrolled {
      background-color: rgba(8, 5, 13, .72);
      -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, .35);
      border-bottom-color: rgba(139, 92, 246, .25);
    }

    /* Links da navbar: sublinhado animado + item ativo */
    .navbar a { position: relative; padding: 6px 0; }
    .navbar a::after {
      content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
      border-radius: 2px; background: var(--roxo-destaque, #8B5CF6);
      transform: scaleX(0); transform-origin: left;
      transition: transform .35s cubic-bezier(.22, 1, .36, 1);
    }
    .navbar a:hover::after, .navbar a.sh-active::after { transform: scaleX(1); }
    body .navbar a.sh-active { color: var(--lavanda, #A78BFA); }

    /* Cards: brilho que segue o mouse, sombra e zoom suave na imagem */
    body .card-container {
      position: relative; overflow: hidden;
      transition: transform .35s ease, border-color .35s ease, box-shadow .35s ease;
    }
    body .card-container:hover { box-shadow: 0 18px 40px -18px rgba(109, 40, 217, .55); }
    .card-container::before {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      opacity: 0; transition: opacity .35s ease;
      background: radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%),
                  rgba(139, 92, 246, .16), transparent 60%);
    }
    .card-container:hover::before { opacity: 1; }
    .card-container #foto { transition: transform .7s cubic-bezier(.22, 1, .36, 1); }
    .card-container:hover #foto { transform: scale(1.04); }

    /* "Quem somos" */
    body #somos {
      transition: transform .35s ease, border-color .35s ease, box-shadow .35s ease;
    }
    body #somos:hover { box-shadow: 0 18px 40px -18px rgba(109, 40, 217, .55); }

    /* Botões: feedback ao clicar */
    body .botao:active, body button:active { transform: scale(.97); }

    /* Logo do Discord: brilho + flutuação suave (começa depois de aparecer) */
    #discordlogo { filter: drop-shadow(0 0 26px rgba(139, 92, 246, .35)); }
    .sh-float { animation: sh-float 5s ease-in-out infinite; }
    @keyframes sh-float {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-8px); }
    }

    /* Estado inicial dos elementos "reveal" (só quando o JS está ativo) */
    ${REVEAL.map((s) => `.sh-js ${s} { opacity: 0; }`).join('\n    ')}
    ${REVEAL.map((s) => `.sh-js ${s}.sh-in { opacity: 1; }`).join('\n    ')}

    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      .sh-float { animation: none; }
    }
  `;

  const style = document.createElement('style');
  style.id = 'sh-animations';
  style.textContent = css;
  document.head.appendChild(style);

  /* ------------------------------------------------------------------------
     2. Funcionalidades (rodam quando o HTML estiver pronto)
     ------------------------------------------------------------------------ */
  function init() {
    const nav = document.querySelector('.navbar');

    /* --- Entrada da navbar --- */
    if (!reduceMotion && nav) {
      nav.animate(
        [
          { opacity: 0, transform: 'translateY(-16px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 650, easing: EASE }
      );
    }

    /* --- Barra de progresso + estado da navbar ao rolar --- */
    const bar = document.createElement('div');
    bar.className = 'sh-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    /* --- Scrollspy: destaca o link da seção visível --- */
    const links = [...document.querySelectorAll('.navbar a[href^="#"]')];
    const setActive = (id) => {
      links.forEach((a) => a.classList.toggle('sh-active', id && a.getAttribute('href') === '#' + id));
    };

    if (links.length && 'IntersectionObserver' in window) {
      const spy = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target.id);
          });
        },
        { rootMargin: '-40% 0px -55% 0px' }
      );
      links.forEach((a) => {
        const section = document.querySelector(a.getAttribute('href'));
        if (section) spy.observe(section);
      });
    }

    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
      if (nav) nav.classList.toggle('sh-scrolled', y > 10);
      if (y < 120) setActive(null);
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener('resize', update);
    update();

    initReveal();
    initSpotlight();
    initPageTransitions();
  }

  /* --- Aparecer ao rolar (fade + slide, com escalonamento entre irmãos) --- */
  function initReveal() {
    const els = [...document.querySelectorAll(REVEAL.join(','))];
    if (!els.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('sh-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        let i = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          io.unobserve(el);

          const delay = Math.min(i++, 6) * 90;
          const distance = el.tagName === 'H4' ? 16 : 28;

          el.classList.add('sh-in');
          const anim = el.animate(
            [
              { opacity: 0, transform: `translateY(${distance}px)` },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            { duration: 800, delay, easing: EASE, fill: 'backwards' }
          );

          if (el.id === 'discordlogo') {
            anim.finished.then(() => el.classList.add('sh-float')).catch(() => {});
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }
    );

    els.forEach((el) => io.observe(el));
  }

  /* --- Brilho que acompanha o mouse dentro dos cards --- */
  function initSpotlight() {
    if (!canHover) return;
    document.addEventListener(
      'pointermove',
      (e) => {
        const card = e.target.closest && e.target.closest('.card-container');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      },
      { passive: true }
    );
  }

  /* --- Transição suave ao trocar de página --- */
  function initPageTransitions() {
    if (reduceMotion) return;
    const main = document.querySelector('main');
    if (!main) return;

    let leaving = false;

    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self')) return;

      const url = new URL(a.href, location.href);
      if (url.protocol !== location.protocol || url.host !== location.host) return; // link externo, mailto...
      if (url.pathname === location.pathname) return; // âncora na mesma página

      e.preventDefault();
      if (leaving) return;
      leaving = true;

      const go = () => { location.href = url.href; };
      main
        .animate(
          [
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(-8px)' },
          ],
          { duration: 240, easing: 'ease-in', fill: 'forwards' }
        )
        .finished.then(go, go);
    });

    /* Voltar pelo botão do navegador: desfaz o fade-out */
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        leaving = false;
        main.getAnimations().forEach((a) => a.cancel());
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
