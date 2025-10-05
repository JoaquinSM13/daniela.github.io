(() => {
  'use strict';

  // Base path derived from this script's URL so assets resolve from any depth
  const getBasePath = () => {
    const currentScript = document.currentScript || Array.from(document.scripts).find(s => /assets\/js\/main\.js$/.test(s.src));
    if (!currentScript) return '/';
    try {
      const url = new URL(currentScript.src, window.location.origin);
      const path = url.pathname.replace(/\/assets\/js\/main\.js$/, '/');
      return path.endsWith('/') ? path : path + '/';
    } catch { return '/'; }
  };
  const BASE = getBasePath();

  // Simple partials loader for header/footer
  const loadPartials = () => {
    const insert = (selector, url) => {
      const slot = document.querySelector(selector);
      if (!slot) return Promise.resolve();
      return fetch(url, { cache: 'no-store' })
        .then(r => r.ok ? r.text() : Promise.reject(r.statusText))
        .then(html => { slot.outerHTML = html; });
    };
    return Promise.all([
      insert('header', BASE + 'partials/header.html'),
      insert('footer', BASE + 'partials/footer.html')
    ]);
  };

  // Smooth scrolling
  const attachSmoothScroll = () => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id && id.length > 1) {
          e.preventDefault();
          const el = document.querySelector(id);
          if (el) el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
        }
      });
    });
  };

  // Render posts on home
  const blogList = document.getElementById('blog-list');
  if (blogList) {
    fetch('posts/posts.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(posts => {
        // Helpers to avoid UTC shift and format in Spanish
        const parseLocalDate = (yyyyMmDd) => {
          const [y, m, d] = yyyyMmDd.split('-').map(Number);
          return new Date(y, m - 1, d);
        };
        const formatDateEs = (yyyyMmDd) => {
          const date = parseLocalDate(yyyyMmDd);
          return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' });
        };
        // Orden por fecha descendente
        posts.sort((a,b) => new Date(b.date) - new Date(a.date));
        const frag = document.createDocumentFragment();

        posts.forEach(p => {
          const card = document.createElement('article');
          card.className = 'blog-card';
          card.innerHTML = `
            <img
              src="${p.image}"
              alt="${p.imageAlt || p.title}"
              class="blog-image"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 360px"
            >
            <div class="blog-content">
              <div class="blog-meta">
                <span><i class="far fa-calendar" aria-hidden="true"></i> ${formatDateEs(p.date)}</span>
                <span><i class="far fa-clock" aria-hidden="true"></i> ${p.readMins} min de lectura</span>
              </div>
              <h3 class="blog-title">${p.title}</h3>
              <p class="blog-excerpt">${p.excerpt}</p>
              <a class="read-more" href="posts/${p.slug}.html" aria-label="Leer ${p.title}">Leer más</a>
            </div>`;
          frag.appendChild(card);
        });

        blogList.appendChild(frag);
      })
      .catch(() => {
        blogList.innerHTML = `<p>No se pudieron cargar los posts. Por favor, actualice.</p>`;
      });
  }
  
  // Initialize
  const ensureFavicon = () => {
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;
    const existing = head.querySelector('link[rel~="icon"]');
    const href = BASE + 'assets/images/site/daniela.ico';
    if (existing) {
      if (existing.getAttribute('href') !== href) existing.setAttribute('href', href);
      if (!existing.getAttribute('type')) existing.setAttribute('type', 'image/x-icon');
      return;
    }
    const link = document.createElement('link');
    link.setAttribute('rel', 'icon');
    link.setAttribute('type', 'image/x-icon');
    link.setAttribute('href', href);
    head.appendChild(link);
  };

  loadPartials().then(() => { ensureFavicon(); attachSmoothScroll(); }).catch(() => { ensureFavicon(); attachSmoothScroll(); });
})();
