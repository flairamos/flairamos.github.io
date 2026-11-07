/* =========================================================
   flairamos.github.io — interactions
   - navigation, scroll state and reveal animations
   - GitHub project sync with cache and offline snapshot
   ========================================================= */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const GITHUB_USER = 'flairamos';
  const GITHUB_API = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`;
  const SNAPSHOT_URL = 'data/projects.json';
  const CACHE_KEY = 'flairamos:projects:v1';
  const CACHE_TTL = 5 * 60 * 1000;
  const MAX_PROJECTS = 8;
  const PRIORITY = [
    'jt808-2019-gateway',
    'ufiber',
    'ginserve',
    'fiberserve',
    'go-component',
    'goutil',
    'awesome-skills',
    'filebrowser-api',
    'flairamos.github.io'
  ];
  const TOPIC_OVERRIDES = {
    'jt808-2019-gateway': ['jt808', 'gateway', 'protocol'],
    'ufiber': ['fiber', 'golang', 'tool'],
    'ginserve': ['gin', 'architecture', 'go'],
    'fiberserve': ['fiber', 'architecture', 'go'],
    'go-component': ['go', 'component'],
    'goutil': ['go', 'utility'],
    'awesome-skills': ['skills', 'tooling'],
    'filebrowser-api': ['filebrowser', 'api', 'go']
  };

  const FALLBACK_PROJECTS = [
    {
      name: 'jt808-2019-gateway',
      description: 'JT808-2019 protocol parser with verification included',
      html_url: 'https://github.com/flairamos/jt808-2019-gateway',
      language: 'Go',
      stargazers_count: 0,
      forks_count: 0,
      pushed_at: '2026-10-19T12:00:19Z',
      topics: ['jt808', 'gateway', 'protocol'],
      license: { spdx_id: 'MIT' }
    },
    {
      name: 'ufiber',
      description: 'the tool of fiber frame',
      html_url: 'https://github.com/flairamos/ufiber',
      language: 'Shell',
      stargazers_count: 0,
      forks_count: 0,
      pushed_at: '2025-06-24T02:58:47Z',
      topics: ['fiber', 'golang', 'tool'],
      license: { spdx_id: 'Apache-2.0' }
    },
    {
      name: 'ginserve',
      description: 'A GIN-based project architecture',
      html_url: 'https://github.com/flairamos/ginserve',
      language: 'Go',
      stargazers_count: 1,
      forks_count: 0,
      pushed_at: '2024-08-13T01:26:18Z',
      topics: ['gin', 'architecture', 'go'],
      license: { spdx_id: 'Apache-2.0' }
    },
    {
      name: 'fiberserve',
      description: 'the fiber frame of go language',
      html_url: 'https://github.com/flairamos/fiberserve',
      language: 'Go',
      stargazers_count: 0,
      forks_count: 0,
      pushed_at: '2024-11-09T09:17:07Z',
      topics: ['fiber', 'architecture', 'go'],
      license: { spdx_id: 'MIT' }
    },
    {
      name: 'go-component',
      description: 'go language usefull component',
      html_url: 'https://github.com/flairamos/go-component',
      language: 'Go',
      stargazers_count: 2,
      forks_count: 0,
      pushed_at: '2024-04-01T09:07:18Z',
      topics: ['go', 'component'],
      license: { spdx_id: 'MIT' }
    },
    {
      name: 'goutil',
      description: 'Golang language widget',
      html_url: 'https://github.com/flairamos/goutil',
      language: 'Go',
      stargazers_count: 0,
      forks_count: 0,
      pushed_at: '2025-04-23T07:09:30Z',
      topics: ['go', 'utility'],
      license: { spdx_id: 'MIT' }
    }
  ];

  const ICONS = {
    star: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 1.8 1.85 3.75 4.14.6-3 2.92.71 4.12L8 11.25l-3.7 1.94.71-4.12-3-2.92 4.14-.6L8 1.8Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    fork: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="4" cy="3.5" r="1.6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="3.5" r="1.6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="12.5" r="1.6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4 5.1v1.2c0 1.2.9 2.1 2.1 2.1h3.8c1.2 0 2.1-.9 2.1-2.1V5.1M8 8.4v2.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
    clock: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.8" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 4.7v3.6l2.3 1.35" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
    license: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 1.8h6.2l2.8 2.8v9.6h-9V1.8Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M9.5 1.8v3h3M5.3 8h4.9M5.3 10.5h3.4" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>'
  };

  const ART_CODE = {
    Go: [
      '<em>// small tools, strong seams</em>',
      '<b>package</b> main',
      '',
      'func main() {',
      '  app := fiber.New()',
      '  app.Listen(<em>":3000"</em>)',
      '}'
    ],
    JavaScript: [
      '<em>// ideas to interfaces</em>',
      '<b>const</b> app = <b>await</b> build()',
      'app.ship({',
      '  quality: <em>true</em>',
      '})'
    ],
    Shell: [
      '<em># one command to run</em>',
      '$ docker compose up -d',
      '$ go run ./cmd/server',
      '<em># keep it observable</em>'
    ],
    HTML: [
      '<em>&lt;!-- content first --&gt;</em>',
      '&lt;main class=<b>"page"</b>&gt;',
      '  &lt;h1&gt;Hello.&lt;/h1&gt;',
      '&lt;/main&gt;'
    ],
    Java: [
      '<em>// clear boundaries</em>',
      '<b>public class</b> App {',
      '  <b>public static void</b> main(...) {',
      '    serve();',
      '  }',
      '}'
    ]
  };

  const ART_TOPOGRAPHY = `
    <svg viewBox="0 0 200 160" fill="none" aria-hidden="true">
      <g stroke="rgba(244,241,232,.34)" stroke-width=".9">
        <path d="M20 128 76 86 121 103 177 43"/>
        <path d="M76 86 94 31 159 55"/>
        <path d="M121 103 167 128"/>
      </g>
      <g fill="#d8ff71">
        <circle cx="20" cy="128" r="3.2"/>
        <circle cx="76" cy="86" r="4.2"/>
        <circle cx="94" cy="31" r="2.6"/>
        <circle cx="121" cy="103" r="3.4"/>
        <circle cx="159" cy="55" r="2.7"/>
        <circle cx="177" cy="43" r="2.2"/>
        <circle cx="167" cy="128" r="2.4"/>
      </g>
      <g fill="none" stroke="rgba(244,241,232,.2)">
        <circle cx="76" cy="86" r="13"/>
        <circle cx="121" cy="103" r="10"/>
      </g>
    </svg>`;

  const el = (tag, className, text) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
  };

  /* -------------------------------------------------------
     Navigation + scroll state
     ------------------------------------------------------- */
  const header = doc.getElementById('site-header');
  const nav = doc.getElementById('primary-nav');
  const menuToggle = doc.getElementById('menu-toggle');
  const navLinks = [...doc.querySelectorAll('.nav-link')];
  const progressBar = doc.getElementById('scroll-progress-bar');
  const sections = ['home', 'about', 'service', 'project', 'review', 'contact']
    .map((id) => doc.getElementById(id))
    .filter(Boolean);
  const mobileQuery = window.matchMedia('(max-width: 900px)');

  function setActiveNav(id) {
    navLinks.forEach((link) => {
      const active = link.dataset.nav === id;
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function closeMenu() {
    header.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', '打开菜单');
  }

  function toggleMenu() {
    const isOpen = !header.classList.contains('is-open');
    header.classList.toggle('is-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
  }

  menuToggle.addEventListener('click', toggleMenu);

  doc.addEventListener('click', (event) => {
    if (header.classList.contains('is-open') && !header.contains(event.target)) closeMenu();
  });

  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  mobileQuery.addEventListener?.('change', (event) => {
    if (!event.matches) closeMenu();
  });

  let scrollTicking = false;

  function updateScrollState() {
    scrollTicking = false;
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportH = window.innerHeight;
    const docH = root.scrollHeight - viewportH;
    const progress = docH > 0 ? Math.min(1, Math.max(0, scrollY / docH)) : 0;
    progressBar.style.transform = `scaleX(${progress.toFixed(4)})`;
    header.classList.toggle('is-scrolled', scrollY > 18);

    const probe = scrollY + Math.min(viewportH * 0.34, 320);
    let current = 'home';
    sections.forEach((section) => {
      if (probe >= section.offsetTop) current = section.id;
    });
    if (current === 'contact') current = '';
    if (current) setActiveNav(current);
    else navLinks.forEach((link) => {
      link.classList.remove('is-active');
      link.removeAttribute('aria-current');
    });
  }

  function requestScrollUpdate() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollState);
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  updateScrollState();

  /* -------------------------------------------------------
     Home → About: tiny pause on the hero, then travel on.
     User interactions cancel the automatic transition.
     ------------------------------------------------------- */
  const homeLink = doc.querySelector('[data-nav="home"]');
  let homeJumpTimer = 0;

  function cancelHomeJump() {
    if (!homeJumpTimer) return;
    window.clearTimeout(homeJumpTimer);
    homeJumpTimer = 0;
  }

  function scrollToSection(id, behavior) {
    const section = doc.getElementById(id);
    if (!section) return;
    const headerOffset = mobileQuery.matches ? 20 : 84;
    const top = section.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior });
  }

  homeLink.addEventListener('click', (event) => {
    event.preventDefault();
    cancelHomeJump();
    closeMenu();
    setActiveNav('home');
    const behavior = prefersReducedMotion.matches ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior });

    homeJumpTimer = window.setTimeout(() => {
      homeJumpTimer = 0;
      scrollToSection('about', behavior);
    }, 1400);
  });

  ['wheel', 'touchstart', 'keydown'].forEach((eventName) => {
    window.addEventListener(eventName, cancelHomeJump, { passive: true });
  });

  doc.addEventListener('click', (event) => {
    if (!event.target.closest('[data-nav="home"]')) cancelHomeJump();
  });

  /* -------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------- */
  const revealItems = [...doc.querySelectorAll('.reveal')];

  if (!('IntersectionObserver' in window) || prefersReducedMotion.matches) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -9% 0px' }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* -------------------------------------------------------
     GitHub projects
     ------------------------------------------------------- */
  const projectGrid = doc.getElementById('project-grid');
  const projectEmpty = doc.getElementById('project-empty');
  const filterBar = doc.getElementById('project-filters');
  const refreshButton = doc.getElementById('refresh-projects');
  const resetFilterButton = doc.getElementById('reset-filter');
  const syncState = doc.getElementById('sync-state');
  const syncDetail = doc.getElementById('sync-detail');
  const syncBox = syncState.closest('.sync-state');

  let allProjects = [];
  let currentFilter = 'all';
  let isRefreshing = false;
  let lastSyncAt = 0;
  let dataOrigin = 'none';

  function readCache() {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.projects) || !parsed.projects.length) return null;
      if (!Number.isFinite(parsed.savedAt)) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function writeCache(projects) {
    try {
      window.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), projects })
      );
    } catch (error) {
      /* Storage can be disabled; the live data still renders. */
    }
  }

  function normalizeProjects(repos) {
    if (!Array.isArray(repos)) return [];

    const seen = new Set();
    return repos
      .filter((repo) => repo && !repo.fork && repo.name !== GITHUB_USER)
      .filter((repo) => {
        if (seen.has(repo.name)) return false;
        seen.add(repo.name);
        return true;
      })
      .map((repo) => ({
        name: String(repo.name || 'untitled'),
        description: String(repo.description || '暂无公开描述，点开仓库看看代码。'),
        html_url: String(repo.html_url || `https://github.com/${GITHUB_USER}`),
        homepage: repo.homepage ? String(repo.homepage) : '',
        language: repo.language ? String(repo.language) : 'Code',
        stargazers_count: Number(repo.stargazers_count) || 0,
        forks_count: Number(repo.forks_count) || 0,
        pushed_at: repo.pushed_at || repo.updated_at || '',
        topics: Array.isArray(repo.topics) && repo.topics.length
          ? repo.topics.filter((topic) => typeof topic === 'string').slice(0, 3)
          : (TOPIC_OVERRIDES[repo.name] || []).slice(0, 3),
        license: repo.license && repo.license.spdx_id
          ? { spdx_id: String(repo.license.spdx_id) }
          : null
      }))
      .sort((a, b) => {
        const aRank = PRIORITY.indexOf(a.name);
        const bRank = PRIORITY.indexOf(b.name);
        if (aRank !== -1 || bRank !== -1) {
          const aValue = aRank === -1 ? 1000 : aRank;
          const bValue = bRank === -1 ? 1000 : bRank;
          if (aValue !== bValue) return aValue - bValue;
        }
        return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
      })
      .slice(0, MAX_PROJECTS);
  }

  function formatDate(value) {
    if (!value) return '未知';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '未知';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date).replace(/\//g, '.');
  }

  function formatRelative(timestamp) {
    const diff = Math.max(0, Date.now() - timestamp);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    return `${Math.floor(hours / 24)} 天前`;
  }

  function setSyncState(mode, detail) {
    syncBox.classList.remove('is-cached', 'is-snapshot');
    if (mode === 'cache') syncBox.classList.add('is-cached');
    if (mode === 'snapshot' || mode === 'fallback' || mode === 'error') {
      syncBox.classList.add('is-snapshot');
    }

    const labels = {
      loading: 'SYNCING GITHUB',
      live: 'LIVE FROM GITHUB',
      cache: 'CACHED FROM GITHUB',
      snapshot: 'GITHUB SNAPSHOT',
      fallback: 'OFFLINE SNAPSHOT',
      error: 'SYNC PAUSED'
    };
    syncState.textContent = labels[mode] || labels.loading;
    syncDetail.textContent = detail;
  }

  function updateFilterButtons() {
    [...filterBar.querySelectorAll('[data-filter]')].forEach((button) => {
      const active = button.dataset.filter === currentFilter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function buildFilters(projects) {
    const preferred = ['Go', 'JavaScript', 'Shell', 'HTML', 'Java', 'Vue'];
    const languages = [...new Set(projects.map((project) => project.language))]
      .filter((language) => language && language !== 'Code')
      .sort((a, b) => {
        const aIndex = preferred.indexOf(a);
        const bIndex = preferred.indexOf(b);
        return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
      });

    filterBar.replaceChildren();

    const allButton = el('button', 'filter-btn', 'All');
    allButton.type = 'button';
    allButton.dataset.filter = 'all';
    filterBar.append(allButton);

    languages.forEach((language) => {
      const button = el('button', 'filter-btn', language);
      button.type = 'button';
      button.dataset.filter = language;
      filterBar.append(button);
    });

    if (currentFilter !== 'all' && !languages.includes(currentFilter)) {
      currentFilter = 'all';
    }
    updateFilterButtons();
  }

  function metaItem(icon, text) {
    const item = el('span');
    item.innerHTML = icon;
    item.append(doc.createTextNode(text));
    return item;
  }

  function createProjectCard(project, index) {
    const card = el('article', `project-card art-variant-${index % 6} project-card--enter`);
    if (index === 0) card.classList.add('project-card--featured');
    card.style.animationDelay = `${Math.min(index * 55, 330)}ms`;

    const artwork = doc.createElement('a');
    artwork.className = 'project-art';
    artwork.href = project.html_url;
    artwork.target = '_blank';
    artwork.rel = 'noopener noreferrer';
    artwork.setAttribute('aria-label', `在 GitHub 查看 ${project.name}`);
    artwork.innerHTML = `
      <span class="art-index"></span>
      <span class="art-open" aria-hidden="true">↗</span>
      <span class="art-glyph" aria-hidden="true"></span>
      <span class="art-kind">PUBLIC REPOSITORY</span>
      <span class="art-code" aria-hidden="true"></span>
      <span class="art-lines" aria-hidden="true">${ART_TOPOGRAPHY}</span>`;

    artwork.querySelector('.art-index').textContent =
      `${String(index + 1).padStart(2, '0')} / ${project.language.toUpperCase()}`;
    artwork.querySelector('.art-glyph').textContent = project.name.charAt(0).toUpperCase();

    const codeLines = ART_CODE[project.language] || [
      '<em>// open source</em>',
      '<b>build</b>(idea)',
      '<b>ship</b>(quality)'
    ];
    artwork.querySelector('.art-code').innerHTML = codeLines
      .map((line) => `<span>${line}</span>`)
      .join('');

    const body = el('div', 'project-body');
    const titleRow = el('div', 'project-title-row');
    const title = el('h3');
    const titleLink = doc.createElement('a');
    titleLink.href = project.html_url;
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
    titleLink.textContent = project.name;
    title.append(titleLink);

    const language = el('span', 'project-language');
    language.dataset.lang = project.language;
    language.append(el('i'), doc.createTextNode(project.language));

    titleRow.append(title, language);
    body.append(titleRow);
    body.append(el('p', 'project-desc', project.description));

    if (project.topics.length) {
      const topics = el('div', 'project-topics');
      project.topics.forEach((topic) => topics.append(el('span', '', `#${topic}`)));
      body.append(topics);
    }

    const meta = el('div', 'project-meta');
    meta.append(metaItem(ICONS.star, String(project.stargazers_count)));
    meta.append(metaItem(ICONS.fork, String(project.forks_count)));
    meta.append(metaItem(ICONS.clock, `更新于 ${formatDate(project.pushed_at)}`));
    if (project.license) meta.append(metaItem(ICONS.license, project.license.spdx_id));
    body.append(meta);

    card.append(artwork, body);
    return card;
  }

  function renderProjects() {
    const visible = currentFilter === 'all'
      ? allProjects
      : allProjects.filter((project) => project.language === currentFilter);

    projectGrid.replaceChildren();
    projectGrid.setAttribute('aria-busy', 'false');

    if (!visible.length) {
      projectGrid.hidden = true;
      projectEmpty.hidden = false;
      return;
    }

    projectGrid.hidden = false;
    projectEmpty.hidden = true;
    visible.forEach((project, index) => {
      projectGrid.append(createProjectCard(project, index));
    });
  }

  function applyProjects(projects, origin) {
    allProjects = projects;
    if (origin) dataOrigin = origin;
    buildFilters(allProjects);
    renderProjects();
  }

  async function fetchSnapshot() {
    try {
      const response = await fetch(SNAPSHOT_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Snapshot HTTP ${response.status}`);
      const payload = await response.json();
      const projects = normalizeProjects(payload.projects);
      if (!projects.length) throw new Error('Snapshot was empty');
      return {
        projects,
        generatedAt: payload.generatedAt || null
      };
    } catch (error) {
      console.warn('[projects] snapshot unavailable:', error);
      return null;
    }
  }

  async function fetchLiveProjects() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(GITHUB_API, {
        cache: 'no-store',
        headers: { Accept: 'application/vnd.github+json' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`GitHub API HTTP ${response.status}`);
      const repos = await response.json();
      const projects = normalizeProjects(repos);
      if (!projects.length) throw new Error('GitHub API returned no projects');
      return projects;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function refreshFromGitHub({ manual = false } = {}) {
    if (isRefreshing) return;
    isRefreshing = true;
    refreshButton.classList.add('is-loading');
    refreshButton.disabled = true;
    if (manual) {
      setSyncState('loading', '正在向 GitHub 请求最新仓库信息…');
    }

    try {
      const projects = await fetchLiveProjects();
      writeCache(projects);
      lastSyncAt = Date.now();
      applyProjects(projects, 'live');
      setSyncState('live', `刚刚同步 · ${projects.length} 个公开仓库`);
    } catch (error) {
      console.warn('[projects] live sync failed:', error);
      if (allProjects.length) {
        if (manual) {
          setSyncState('error', '刷新失败 · 保留当前列表');
        } else if (dataOrigin === 'cache') {
          setSyncState(
            'cache',
            lastSyncAt
              ? `上次同步 ${formatRelative(lastSyncAt)} · 使用本地缓存`
              : '使用本地缓存 · 等待下次同步'
          );
        }
        return;
      }

      const snapshot = await fetchSnapshot();
      if (snapshot) {
        applyProjects(snapshot.projects, 'snapshot');
        setSyncState(
          'snapshot',
          `快照 ${formatDate(snapshot.generatedAt)} · ${snapshot.projects.length} 个公开仓库`
        );
      } else {
        applyProjects(normalizeProjects(FALLBACK_PROJECTS), 'fallback');
        setSyncState('fallback', '离线数据 · GitHub 暂时不可用');
      }
    } finally {
      isRefreshing = false;
      refreshButton.classList.remove('is-loading');
      refreshButton.disabled = false;
    }
  }

  async function initProjects() {
    const cached = readCache();

    if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
      lastSyncAt = cached.savedAt;
      applyProjects(cached.projects, 'cache');
      setSyncState(
        'cache',
        `缓存于 ${formatRelative(cached.savedAt)} · ${cached.projects.length} 个公开仓库`
      );
      return;
    }

    if (cached) {
      lastSyncAt = cached.savedAt;
      applyProjects(cached.projects, 'cache');
      setSyncState(
        'cache',
        `缓存于 ${formatRelative(cached.savedAt)} · 正在后台检查更新`
      );
      await refreshFromGitHub();
      return;
    }

    // Render the local snapshot immediately, then revalidate against GitHub.
    // This means a slow or rate-limited API never leaves the section empty.
    const snapshot = await fetchSnapshot();
    if (snapshot) {
      applyProjects(snapshot.projects, 'snapshot');
      setSyncState(
        'snapshot',
        `快照 ${formatDate(snapshot.generatedAt)} · ${snapshot.projects.length} 个公开仓库`
      );
    } else {
      applyProjects(normalizeProjects(FALLBACK_PROJECTS), 'fallback');
      setSyncState('fallback', '离线数据 · 正在尝试连接 GitHub');
    }

    await refreshFromGitHub();
  }

  filterBar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    currentFilter = button.dataset.filter;
    updateFilterButtons();
    renderProjects();
  });

  resetFilterButton.addEventListener('click', () => {
    currentFilter = 'all';
    updateFilterButtons();
    renderProjects();
  });

  refreshButton.addEventListener('click', () => {
    refreshFromGitHub({ manual: true });
  });

  initProjects();

  /* -------------------------------------------------------
     Footer year
     ------------------------------------------------------- */
  const year = doc.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
