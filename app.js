(function () {
  'use strict';

  const VISITOR_MODE = document.documentElement.dataset.mode === 'visitor';
  const STORAGE_VIDEOS_KEY = 'od46_portal_videos_v1';
  const STORAGE_HISTORY_KEY = 'od46_portal_history_v1';
  const CATEGORIES = ['電視冠番', '電視劇/電影', '演唱會', '綜藝節目'];

  // Gradient presets for cards without custom cover URL
  const COVER_GRADIENTS = [
    'from-sky-400 via-blue-500 to-indigo-600',
    'from-indigo-400 via-purple-500 to-pink-500',
    'from-cyan-400 via-sky-500 to-blue-600',
    'from-rose-400 via-red-500 to-orange-500',
    'from-violet-500 via-indigo-600 to-blue-700',
    'from-teal-400 via-emerald-500 to-cyan-600'
  ];

  // Initial sample catalog (users can edit/replace with their own OneDrive <iframe> codes)
  const DEFAULT_VIDEOS = [
    {
      id: 'vod-101',
      title: '週日冠名綜藝 #01 範例（可直接播放測試）',
      category: '電視冠番',
      subTag: '冠名節目',
      status: '更新至 第2集',
      year: '2026',
      cover: '',
      desc: '示範如何配置多集數與 OneDrive iframe 內嵌碼。第 1 集內建公開 MP4 測試源，第 2 集可點「修改本集 iframe」貼上你的 OneDrive 內嵌碼。',
      episodes: [
        { name: '第01集 (測試源)', embed: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { name: '第02集 (待貼入)', embed: '' }
      ]
    },
    {
      id: 'vod-102',
      title: '夏日戶外巡演 2026 最終場 完整版',
      category: '演唱會',
      subTag: '巡演 LIVE',
      status: '已完結',
      year: '2026',
      cover: '',
      desc: '點擊「編輯 / 貼上內嵌碼」即可填入 OneDrive 產生的 <iframe> 標籤，支援上下半場與安可分集切換。',
      episodes: [
        { name: '上半場', embed: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
        { name: '下半場 + Encore', embed: '' }
      ]
    },
    {
      id: 'vod-103',
      title: '深夜外景特別企劃：海邊合宿篇',
      category: '綜藝節目',
      subTag: '特別企劃',
      status: '全2集',
      year: '2026',
      cover: '',
      desc: '高畫質中文字幕版，點擊右上角「修改本集 iframe」貼入你的 OneDrive 內嵌碼即可播放。',
      episodes: [
        { name: '前篇', embed: '' },
        { name: '後篇', embed: '' }
      ]
    },
    {
      id: 'vod-104',
      title: '青春校園短劇：放學後的屋頂',
      category: '電視劇/電影',
      subTag: '日劇中字',
      status: '更新至 第3集',
      year: '2026',
      cover: '',
      desc: '校園懸疑青春劇，支援多集切換與自動紀錄觀看進度。',
      episodes: [
        { name: 'EP01', embed: '' },
        { name: 'EP02', embed: '' },
        { name: 'EP03', embed: '' }
      ]
    },
    {
      id: 'vod-105',
      title: '新人成員初登場特輯 幕後花絮',
      category: '電視冠番',
      subTag: '幕後花絮',
      status: 'HD 中字',
      year: '2026',
      cover: '',
      desc: '收錄完整練習室訪談與彩排紀錄，請點選編輯貼上 OneDrive 內嵌碼。',
      episodes: [
        { name: '正片', embed: '' }
      ]
    }
  ];

  // App State
  const state = {
    videos: [],
    history: [],
    view: 'home', // 'home' | 'category' | 'detail' | 'play'
    latestFilter: '全部',
    activeCategory: '電視冠番',
    activeSubTag: '全部',
    searchQuery: '',
    currentVideoId: null,
    currentEpIndex: 0,
    sidebarCollapsed: false
  };

  // DOM Elements
  const els = {
    topNav: document.getElementById('topNav'),
    navLogoBtn: document.getElementById('navLogoBtn'),
    innerSearchForm: document.getElementById('innerSearchForm'),
    innerSearchInput: document.getElementById('innerSearchInput'),
    btnHistory: document.getElementById('btnHistory'),
    btnOpenNotice: document.getElementById('btnOpenNotice'),
    btnOpenAdmin: document.getElementById('btnOpenAdmin'),
    btnMobileMenu: document.getElementById('btnMobileMenu'),
    mobileNavMenu: document.getElementById('mobileNavMenu'),

    viewHome: document.getElementById('viewHome'),
    viewCategory: document.getElementById('viewCategory'),
    viewDetail: document.getElementById('viewDetail'),
    viewPlay: document.getElementById('viewPlay'),

    heroSearchForm: document.getElementById('heroSearchForm'),
    heroSearchInput: document.getElementById('heroSearchInput'),
    searchResultSection: document.getElementById('searchResultSection'),
    searchResultMeta: document.getElementById('searchResultMeta'),
    searchResultGrid: document.getElementById('searchResultGrid'),
    btnClearSearch: document.getElementById('btnClearSearch'),
    latestFilterBar: document.getElementById('latestFilterBar'),
    latestGrid: document.getElementById('latestGrid'),
    btnQuickAddFromHome: document.getElementById('btnQuickAddFromHome'),
    homeCategorySections: document.getElementById('homeCategorySections'),

    catBreadcrumb: document.getElementById('catBreadcrumb'),
    catPageTitle: document.getElementById('catPageTitle'),
    catCountBadge: document.getElementById('catCountBadge'),
    subCatFilterBar: document.getElementById('subCatFilterBar'),
    categoryGrid: document.getElementById('categoryGrid'),

    detailCatLink: document.getElementById('detailCatLink'),
    detailTitleCrumb: document.getElementById('detailTitleCrumb'),
    detailCatBadge: document.getElementById('detailCatBadge'),
    detailSubTagBadge: document.getElementById('detailSubTagBadge'),
    detailYearBadge: document.getElementById('detailYearBadge'),
    detailTitle: document.getElementById('detailTitle'),
    detailStatus: document.getElementById('detailStatus'),
    detailEpCount: document.getElementById('detailEpCount'),
    detailDesc: document.getElementById('detailDesc'),
    detailCoverBox: document.getElementById('detailCoverBox'),
    btnDetailPlay: document.getElementById('btnDetailPlay'),
    btnDetailEdit: document.getElementById('btnDetailEdit'),
    btnDetailShare: document.getElementById('btnDetailShare'),
    btnDetailAddEp: document.getElementById('btnDetailAddEp'),
    detailEpisodeGrid: document.getElementById('detailEpisodeGrid'),
    detailRelatedGrid: document.getElementById('detailRelatedGrid'),

    playCatLink: document.getElementById('playCatLink'),
    playDetailLink: document.getElementById('playDetailLink'),
    playEpCrumb: document.getElementById('playEpCrumb'),
    playLeftCol: document.getElementById('playLeftCol'),
    playRightCol: document.getElementById('playRightCol'),
    embedMount: document.getElementById('embedMount'),
    btnToggleSidebar: document.getElementById('btnToggleSidebar'),
    toggleSidebarIcon: document.getElementById('toggleSidebarIcon'),
    playVideoTitle: document.getElementById('playVideoTitle'),
    playEpBadge: document.getElementById('playEpBadge'),
    btnPlayNextEp: document.getElementById('btnPlayNextEp'),
    btnEditCurrentEmbed: document.getElementById('btnEditCurrentEmbed'),
    playSidebarSub: document.getElementById('playSidebarSub'),
    btnSidebarAddEp: document.getElementById('btnSidebarAddEp'),
    playEpisodeList: document.getElementById('playEpisodeList'),
    btnPlayMoreRelated: document.getElementById('btnPlayMoreRelated'),
    playRelatedGrid: document.getElementById('playRelatedGrid'),

    btnFooterExportVideosJson: document.getElementById('btnFooterExportVideosJson'),
    btnFooterExportVideosJs: document.getElementById('btnFooterExportVideosJs'),
    btnFooterExportJson: document.getElementById('btnFooterExportJson'),
    fabAddVideo: document.getElementById('fabAddVideo'),
    fabScrollTop: document.getElementById('fabScrollTop'),

    adminModal: document.getElementById('adminModal'),
    adminModalTitle: document.getElementById('adminModalTitle'),
    btnAdminExportJson: document.getElementById('btnAdminExportJson'),
    btnCloseAdmin: document.getElementById('btnCloseAdmin'),
    btnCancelAdmin: document.getElementById('btnCancelAdmin'),
    importJsonFile: document.getElementById('importJsonFile'),
    videoForm: document.getElementById('videoForm'),
    formVideoId: document.getElementById('formVideoId'),
    formTitle: document.getElementById('formTitle'),
    formCategory: document.getElementById('formCategory'),
    formSubTag: document.getElementById('formSubTag'),
    formStatus: document.getElementById('formStatus'),
    formYear: document.getElementById('formYear'),
    formCover: document.getElementById('formCover'),
    formDesc: document.getElementById('formDesc'),
    btnAddEpisodeRow: document.getElementById('btnAddEpisodeRow'),
    episodeRowsContainer: document.getElementById('episodeRowsContainer'),
    btnDeleteVideo: document.getElementById('btnDeleteVideo'),

    noticeModal: document.getElementById('noticeModal'),
    btnCloseNotice: document.getElementById('btnCloseNotice'),

    historyModal: document.getElementById('historyModal'),
    btnClearHistory: document.getElementById('btnClearHistory'),
    btnCloseHistory: document.getElementById('btnCloseHistory'),
    historyList: document.getElementById('historyList'),

    toastContainer: document.getElementById('toastContainer')
  };

  const STORAGE_UPDATED_KEY = 'od46_portal_updated_at_v1';

  function readFallbackVideos() {
    try {
      const globalData = window.S46SUB_DATA;
      if (globalData && Array.isArray(globalData.videos) && globalData.videos.length > 0) {
        return {
          videos: globalData.videos,
          exportedAt: Number(globalData.exportedAt || 0) || 0
        };
      }
      if (Array.isArray(globalData) && globalData.length > 0) {
        return { videos: globalData, exportedAt: 0 };
      }
    } catch (e) {}
    return {
      videos: DEFAULT_VIDEOS.map((v) => ({ ...v, episodes: v.episodes.map((ep) => ({ ...ep })) })),
      exportedAt: 0
    };
  }

  async function fetchExternalVideos() {
    try {
      const res = await fetch('data/videos.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { videos: data, exportedAt: 0 };
      }
      if (data && Array.isArray(data.videos) && data.videos.length > 0) {
        return { videos: data.videos, exportedAt: Number(data.exportedAt || 0) || 0 };
      }
    } catch (e) {
      // Fallback to data/videos.js when opened locally via file://
    }
    return readFallbackVideos();
  }

  async function loadData() {
    const external = await fetchExternalVideos();
    if (VISITOR_MODE) {
      state.videos = external.videos;
    } else {
      let loadedFromStorage = false;
      try {
        const rawV = localStorage.getItem(STORAGE_VIDEOS_KEY);
        const savedAt = parseInt(localStorage.getItem(STORAGE_UPDATED_KEY) || '0', 10) || 0;
        if (rawV && savedAt >= external.exportedAt) {
          const parsed = JSON.parse(rawV);
          if (Array.isArray(parsed) && parsed.length > 0) {
            state.videos = parsed;
            loadedFromStorage = true;
          }
        }
      } catch (e) {}
      if (!loadedFromStorage) {
        state.videos = external.videos;
      }
    }
    try {
      const rawH = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (rawH) {
        const parsedH = JSON.parse(rawH);
        if (Array.isArray(parsedH)) state.history = parsedH;
      }
    } catch (e) {}
  }

  function saveVideos() {
    try {
      localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(state.videos));
      localStorage.setItem(STORAGE_UPDATED_KEY, String(Date.now()));
    } catch (e) {}
  }

  function saveHistory() {
    try { localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(state.history.slice(0, 30))); } catch (e) {}
  }

  function recordHistory(videoId, epIndex) {
    const video = state.videos.find((v) => v.id === videoId);
    if (!video) return;
    const ep = video.episodes[epIndex] || { name: '正片' };
    state.history = state.history.filter((h) => h.videoId !== videoId);
    state.history.unshift({
      videoId,
      epIndex,
      title: video.title,
      epName: ep.name,
      category: video.category,
      time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    });
    saveHistory();
  }

  // Utilities
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg, type) {
    const div = document.createElement('div');
    const cls = type === 'error'
      ? 'bg-red-600 text-white'
      : type === 'success'
        ? 'bg-[#1F2329] text-white border border-emerald-400/40'
        : 'bg-[#1F2329] text-white';
    div.className = `pointer-events-auto px-4 py-2 rounded-full text-xs font-medium shadow-xl transition-all duration-300 opacity-0 translate-y-2 ${cls}`;
    div.textContent = msg;
    els.toastContainer.appendChild(div);
    requestAnimationFrame(() => div.classList.remove('opacity-0', 'translate-y-2'));
    setTimeout(() => {
      div.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => div.remove(), 300);
    }, 2500);
  }

  function copyText(text, label) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast(`已複製${label || ''}`, 'success')).catch(() => fallbackCopy(text, label));
    } else {
      fallbackCopy(text, label);
    }
  }

  function fallbackCopy(text, label) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(`已複製${label || ''}`, 'success');
    } catch (e) {
      showToast('複製失敗，請手動選取', 'error');
    }
    document.body.removeChild(ta);
  }

  function gradientForId(id) {
    let sum = 0;
    const s = String(id || '0');
    for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
    return COVER_GRADIENTS[sum % COVER_GRADIENTS.length];
  }

  // Parse user-provided OneDrive <iframe> or URL
  function parseEmbedSource(raw) {
    const trimmed = (raw || '').trim();
    if (!trimmed) return { kind: 'empty', src: '', raw: '' };

    // Extract src from full <iframe ...></iframe>
    const iframeMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch && iframeMatch[1]) {
      const src = iframeMatch[1].replace(/&amp;/g, '&');
      return { kind: 'iframe', src, raw: trimmed };
    }

    // Direct MP4 / WebM video URL
    if (/^https?:\/\/.+\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(trimmed)) {
      return { kind: 'video', src: trimmed, raw: trimmed };
    }

    // Plain URL (treat as iframe embed URL)
    if (/^https?:\/\//i.test(trimmed)) {
      return { kind: 'iframe', src: trimmed, raw: trimmed };
    }

    return { kind: 'invalid', src: '', raw: trimmed };
  }

  // Render a single h46sub.cc-style Video Card
  function renderVodCardHtml(v) {
    const grad = gradientForId(v.id);
    const tag = v.subTag || v.category;
    const coverHtml = v.cover
      ? `<img src="${escapeHtml(v.cover)}" alt="${escapeHtml(v.title)}" referrerpolicy="no-referrer" class="w-full h-full object-cover" loading="lazy" />`
      : `<div class="vod-cover-bg w-full h-full bg-gradient-to-br ${grad} flex flex-col items-center justify-center p-3 text-center">
           <span class="text-white/90 font-extrabold text-lg tracking-wider drop-shadow">${escapeHtml(tag)}</span>
           <span class="text-white/75 text-[11px] mt-1 line-clamp-1">${escapeHtml(v.category)}</span>
         </div>`;

    return `
      <article data-vod-id="${escapeHtml(v.id)}" class="vod-card group cursor-pointer flex flex-col">
        <div class="relative aspect-video rounded-lg overflow-hidden bg-slate-100 shadow-xs">
          ${coverHtml}
          <span class="absolute left-2 bottom-2 px-2 py-0.5 rounded bg-black/65 backdrop-blur-xs text-[11px] font-medium text-white max-w-[80%] truncate">
            ${escapeHtml(tag)}
          </span>
          <div class="vod-hover absolute inset-0 bg-black/45 flex items-center justify-center">
            <span class="w-10 h-10 rounded-full bg-accent-500 text-white flex items-center justify-center shadow-lg">
              <i data-lucide="play" class="w-4 h-4 fill-current ml-0.5"></i>
            </span>
          </div>
        </div>
        <h3 class="mt-2 text-[13px] sm:text-sm font-bold text-[#1F2329] group-hover:text-accent-500 transition truncate" title="${escapeHtml(v.title)}">
          ${escapeHtml(v.title)}
        </h3>
        <p class="text-xs text-[#86909C] mt-0.5 truncate">${escapeHtml(v.status || `共 ${v.episodes.length} 集`)}</p>
      </article>
    `;
  }

  // Navigation & Header Styling
  function updateTopNavStyle() {
    const isHomeTop = state.view === 'home' && window.scrollY < 120;
    if (isHomeTop) {
      els.topNav.className = 'fixed top-0 inset-x-0 z-40 transition-colors duration-200 bg-gradient-to-b from-black/55 to-transparent';
      els.innerSearchForm.classList.add('hidden');
      els.innerSearchForm.classList.remove('md:flex');
    } else {
      els.topNav.className = 'fixed top-0 inset-x-0 z-40 transition-colors duration-200 bg-[#14161A]/95 backdrop-blur-md shadow-md';
      els.innerSearchForm.classList.remove('hidden');
      els.innerSearchForm.classList.add('md:flex');
    }

    // Highlight active nav item
    document.querySelectorAll('.nav-link').forEach((btn) => {
      const isMatch =
        (state.view === 'home' && btn.dataset.nav === 'home') ||
        (state.view === 'category' && btn.dataset.nav === 'category' && btn.dataset.cat === state.activeCategory);
      btn.className = isMatch
        ? 'nav-link relative py-1 text-accent-500 font-bold transition'
        : 'nav-link relative py-1 text-white/85 hover:text-white transition';
    });
  }

  function switchView(viewName) {
    state.view = viewName;
    els.viewHome.classList.toggle('hidden', viewName !== 'home');
    els.viewCategory.classList.toggle('hidden', viewName !== 'category');
    els.viewDetail.classList.toggle('hidden', viewName !== 'detail');
    els.viewPlay.classList.toggle('hidden', viewName !== 'play');
    els.mobileNavMenu.classList.add('hidden');

    // Stop playback when leaving play view
    if (viewName !== 'play') {
      els.embedMount.innerHTML = '';
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    updateTopNavStyle();
  }

  // Render Home View
  function renderHome() {
    switchView('home');

    // Search results section
    const q = state.searchQuery.trim().toLowerCase();
    if (q) {
      const hits = state.videos.filter((v) =>
        v.title.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        (v.subTag || '').toLowerCase().includes(q) ||
        (v.desc || '').toLowerCase().includes(q)
      );
      els.searchResultSection.classList.remove('hidden');
      els.searchResultMeta.textContent = `關鍵字「${state.searchQuery}」共找到 ${hits.length} 部`;
      els.searchResultGrid.innerHTML = hits.length
        ? hits.map(renderVodCardHtml).join('')
        : `<div class="col-span-full py-10 text-center text-sm text-slate-400 bg-slate-50 rounded-xl">找不到符合「${escapeHtml(state.searchQuery)}」的影片</div>`;
    } else {
      els.searchResultSection.classList.add('hidden');
    }

    // Latest filter pills
    const tabs = ['全部', ...CATEGORIES];
    els.latestFilterBar.innerHTML = tabs.map((tab) => {
      const active = tab === state.latestFilter;
      return `<button type="button" data-latest-tab="${escapeHtml(tab)}" class="latest-tab px-3.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
        active ? 'cat-pill-active font-semibold' : 'bg-[#F5F6F8] text-slate-600 hover:bg-slate-200'
      }">${escapeHtml(tab)}</button>`;
    }).join('');

    const latestItems = state.latestFilter === '全部'
      ? state.videos.slice(0, 10)
      : state.videos.filter((v) => v.category === state.latestFilter).slice(0, 10);

    els.latestGrid.innerHTML = latestItems.length
      ? latestItems.map(renderVodCardHtml).join('')
      : `<div class="col-span-full py-10 text-center text-sm text-slate-400 bg-slate-50 rounded-xl">此分類尚無影片，點擊「新增 / 管理影片」貼上 OneDrive 內嵌碼即可上架。</div>`;

    // Category sections
    els.homeCategorySections.innerHTML = CATEGORIES.map((cat) => {
      const list = state.videos.filter((v) => v.category === cat).slice(0, 5);
      if (list.length === 0) return '';
      return `
        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-[#1F2329] tracking-tight">${escapeHtml(cat)}</h2>
            <button type="button" data-more-cat="${escapeHtml(cat)}" class="more-cat-btn px-3.5 py-1 rounded-full text-xs font-medium bg-[#F5F6F8] hover:bg-accent-50 hover:text-accent-600 text-slate-600 transition cursor-pointer">
              更多${escapeHtml(cat)} &gt;
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            ${list.map(renderVodCardHtml).join('')}
          </div>
        </section>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  // Render Category View
  function renderCategory(catName) {
    state.activeCategory = catName;
    state.activeSubTag = '全部';
    switchView('category');
    renderCategoryGridOnly();
  }

  function renderCategoryGridOnly() {
    const catVideos = state.videos.filter((v) => v.category === state.activeCategory);
    const subTags = ['全部', ...new Set(catVideos.map((v) => v.subTag).filter(Boolean))];
    if (!subTags.includes(state.activeSubTag)) state.activeSubTag = '全部';

    els.catBreadcrumb.textContent = state.activeCategory;
    els.catPageTitle.textContent = state.activeCategory;

    const filtered = state.activeSubTag === '全部'
      ? catVideos
      : catVideos.filter((v) => v.subTag === state.activeSubTag);

    els.catCountBadge.textContent = `共 ${filtered.length} 部影片`;

    els.subCatFilterBar.innerHTML = subTags.map((tag) => {
      const active = tag === state.activeSubTag;
      return `<button type="button" data-subtag="${escapeHtml(tag)}" class="subtag-pill px-3.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
        active ? 'cat-pill-active font-semibold' : 'bg-[#F5F6F8] text-slate-600 hover:bg-slate-200'
      }">${escapeHtml(tag)}</button>`;
    }).join('');

    els.categoryGrid.innerHTML = filtered.length
      ? filtered.map(renderVodCardHtml).join('')
      : `<div class="col-span-full py-12 text-center text-sm text-slate-400 bg-slate-50 rounded-xl">此分類目前沒有影片</div>`;

    if (window.lucide) lucide.createIcons();
  }

  // Render Detail View
  function renderDetail(videoId) {
    const video = state.videos.find((v) => v.id === videoId);
    if (!video) return renderHome();
    state.currentVideoId = video.id;
    switchView('detail');

    els.detailCatLink.textContent = video.category;
    els.detailTitleCrumb.textContent = video.title;
    els.detailCatBadge.textContent = video.category;
    els.detailSubTagBadge.textContent = video.subTag || '精選';
    els.detailYearBadge.textContent = video.year || '2026';
    els.detailTitle.textContent = video.title;
    els.detailStatus.textContent = video.status || `共 ${video.episodes.length} 集`;
    els.detailEpCount.textContent = `${video.episodes.length} 集`;
    els.detailDesc.textContent = video.desc || '暫無簡介。';

    const grad = gradientForId(video.id);
    els.detailCoverBox.innerHTML = video.cover
      ? `<img src="${escapeHtml(video.cover)}" alt="${escapeHtml(video.title)}" referrerpolicy="no-referrer" class="w-full h-full object-cover" />`
      : `<div class="w-full h-full bg-gradient-to-br ${grad} flex flex-col items-center justify-center p-4 text-center">
           <span class="text-white font-extrabold text-xl tracking-wider">${escapeHtml(video.subTag || video.category)}</span>
           <span class="text-white/80 text-xs mt-1">${escapeHtml(video.title)}</span>
         </div>`;

    els.detailEpisodeGrid.innerHTML = video.episodes.map((ep, idx) => {
      const hasSrc = Boolean((ep.embed || '').trim());
      return `
        <button type="button" data-play-ep="${idx}" class="detail-ep-btn px-3 py-2 rounded-lg text-xs font-medium border transition text-center truncate cursor-pointer ${
          hasSrc
            ? 'bg-[#F5F6F8] hover:bg-accent-500 hover:text-white hover:border-accent-500 border-slate-200 text-slate-800'
            : 'bg-white border-dashed border-slate-300 text-slate-400 hover:border-accent-500 hover:text-accent-600'
        }">
          ${escapeHtml(ep.name || `第${idx + 1}集`)}
        </button>
      `;
    }).join('');

    const related = state.videos.filter((v) => v.id !== video.id).slice(0, 5);
    els.detailRelatedGrid.innerHTML = related.map(renderVodCardHtml).join('');
    if (window.lucide) lucide.createIcons();
  }

  // Render Player View
  function renderPlay(videoId, epIndex) {
    const video = state.videos.find((v) => v.id === videoId);
    if (!video) return renderHome();
    state.currentVideoId = video.id;
    state.currentEpIndex = Math.max(0, Math.min(epIndex || 0, video.episodes.length - 1));
    recordHistory(video.id, state.currentEpIndex);
    switchView('play');

    const ep = video.episodes[state.currentEpIndex] || { name: '第1集', embed: '' };
    const parsed = parseEmbedSource(ep.embed);

    els.playCatLink.textContent = video.category;
    els.playDetailLink.textContent = video.title;
    els.playEpCrumb.textContent = ep.name;
    els.playVideoTitle.textContent = video.title;
    els.playEpBadge.textContent = ep.name;
    els.playSidebarSub.textContent = `${video.category} · 共 ${video.episodes.length} 集`;

    // Next episode button state
    const hasNext = state.currentEpIndex < video.episodes.length - 1;
    els.btnPlayNextEp.classList.toggle('hidden', !hasNext);

    // Mount OneDrive <iframe> or HTML5 <video> or Empty prompt
    if (parsed.kind === 'iframe') {
      els.embedMount.innerHTML = `
        <iframe
          src="${escapeHtml(parsed.src)}"
          class="w-full h-full border-0 bg-black"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      `;
    } else if (parsed.kind === 'video') {
      els.embedMount.innerHTML = `
        <video
          src="${escapeHtml(parsed.src)}"
          class="w-full h-full bg-black object-contain"
          controls
          playsinline
        ></video>
      `;
    } else {
      els.embedMount.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 to-black">
          <div class="w-12 h-12 rounded-2xl bg-accent-500/20 text-accent-500 flex items-center justify-center mb-3">
            <i data-lucide="code-2" class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-bold text-white mb-1">${VISITOR_MODE ? '本集影片尚未上架' : '尚未填入本集的 OneDrive 內嵌碼'}</h3>
          <p class="text-xs text-slate-400 max-w-md mb-4">
            ${VISITOR_MODE
              ? '此集數目前尚未更新片源，請先切換其他集數或稍後再回來觀看。'
              : `點擊下方按鈕即可為「${escapeHtml(video.title)} — ${escapeHtml(ep.name)}」貼上您從 OneDrive 取得的 <code class="text-sky-300">&lt;iframe ...&gt;&lt;/iframe&gt;</code> 內嵌連結。`}
          </p>
          ${VISITOR_MODE ? '' : `<button id="btnMountPasteEmbed" type="button" class="px-5 py-2 rounded-full text-xs font-bold bg-accent-500 hover:bg-accent-600 text-white shadow-lg shadow-red-500/25 transition cursor-pointer">立即貼上 OneDrive &lt;iframe&gt; 碼</button>`}
        </div>
      `;
      const pasteBtn = document.getElementById('btnMountPasteEmbed');
      if (pasteBtn) {
        pasteBtn.addEventListener('click', () => openAdminModal(video.id));
      }
    }

    // Render Episode Sidebar
    els.playEpisodeList.innerHTML = video.episodes.map((item, idx) => {
      const active = idx === state.currentEpIndex;
      return `
        <button type="button" data-sidebar-ep="${idx}" class="sidebar-ep-btn px-2.5 py-2 rounded-lg text-xs font-medium transition truncate text-center cursor-pointer ${
          active
            ? 'bg-accent-500 text-white font-bold shadow-md shadow-red-500/20'
            : 'bg-cinema-900 hover:bg-cinema-700 text-slate-300 border border-white/5'
        }">
          ${escapeHtml(item.name || `第${idx + 1}集`)}
        </button>
      `;
    }).join('');

    // Related Videos
    const related = state.videos.filter((v) => v.id !== video.id).slice(0, 5);
    els.playRelatedGrid.innerHTML = related.map(renderVodCardHtml).join('');
    if (window.lucide) lucide.createIcons();
  }

  // Admin Modal Logic
  function addEpisodeRow(name, embed) {
    const row = document.createElement('div');
    row.className = 'ep-row p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2';
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <input type="text" class="ep-name-input w-36 sm:w-44 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-accent-500" placeholder="集數名稱 (如 EP01)" value="${escapeHtml(name || '')}" required />
        <span class="text-[11px] text-slate-400 flex-1">貼上 OneDrive &lt;iframe&gt; 完整代碼</span>
        <button type="button" class="btn-remove-ep p-1 text-slate-400 hover:text-red-500 transition" title="刪除此集">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
      <textarea rows="2" class="ep-embed-input w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-700 focus:outline-none focus:border-accent-500 resize-y" placeholder='<iframe src="https://onedrive.live.com/embed?..." width="640" height="360" frameborder="0" scrolling="no" allowfullscreen></iframe>'>${escapeHtml(embed || '')}</textarea>
    `;
    row.querySelector('.btn-remove-ep').addEventListener('click', () => {
      if (els.episodeRowsContainer.querySelectorAll('.ep-row').length <= 1) {
        showToast('至少需保留 1 個分集欄位', 'error');
        return;
      }
      row.remove();
    });
    els.episodeRowsContainer.appendChild(row);
    if (window.lucide) lucide.createIcons();
  }

  function openAdminModal(editVideoId) {
    els.episodeRowsContainer.innerHTML = '';
    if (editVideoId) {
      const v = state.videos.find((item) => item.id === editVideoId);
      if (!v) return;
      els.adminModalTitle.textContent = '編輯影片與 OneDrive 內嵌碼';
      els.formVideoId.value = v.id;
      els.formTitle.value = v.title;
      els.formCategory.value = v.category;
      els.formSubTag.value = v.subTag || '';
      els.formStatus.value = v.status || '';
      els.formYear.value = v.year || '2026';
      els.formCover.value = v.cover || '';
      els.formDesc.value = v.desc || '';
      els.btnDeleteVideo.classList.remove('hidden');
      (v.episodes && v.episodes.length ? v.episodes : [{ name: '第01集', embed: '' }]).forEach((ep) => {
        addEpisodeRow(ep.name, ep.embed);
      });
    } else {
      els.adminModalTitle.textContent = '新增影片（填入 OneDrive iframe 內嵌碼）';
      els.formVideoId.value = '';
      els.formTitle.value = '';
      els.formCategory.value = '電視冠番';
      els.formSubTag.value = '';
      els.formStatus.value = '第01集';
      els.formYear.value = '2026';
      els.formCover.value = '';
      els.formDesc.value = '';
      els.btnDeleteVideo.classList.add('hidden');
      addEpisodeRow('第01集', '');
    }
    els.adminModal.classList.remove('hidden');
    els.adminModal.classList.add('flex');
    els.formTitle.focus();
  }

  function closeAdminModal() {
    els.adminModal.classList.add('hidden');
    els.adminModal.classList.remove('flex');
  }

  // History Modal
  function openHistoryModal() {
    if (state.history.length === 0) {
      els.historyList.innerHTML = `<div class="py-8 text-center text-xs text-slate-400">目前還沒有觀看紀錄</div>`;
    } else {
      els.historyList.innerHTML = state.history.map((h) => `
        <button type="button" data-hist-vid="${escapeHtml(h.videoId)}" data-hist-ep="${h.epIndex}" class="hist-item w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-accent-50 border border-slate-100 flex items-center justify-between gap-2 transition cursor-pointer">
          <div class="min-w-0">
            <p class="text-xs font-bold text-[#1F2329] truncate">${escapeHtml(h.title)}</p>
            <p class="text-[11px] text-slate-500 mt-0.5">${escapeHtml(h.category)} · ${escapeHtml(h.epName)}</p>
          </div>
          <span class="text-[11px] text-slate-400 shrink-0">${escapeHtml(h.time)}</span>
        </button>
      `).join('');
    }
    els.historyModal.classList.remove('hidden');
    els.historyModal.classList.add('flex');
  }

  function closeHistoryModal() {
    els.historyModal.classList.add('hidden');
    els.historyModal.classList.remove('flex');
  }

  // Export modular data files (data/videos.json & data/videos.js)
  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // If the Admin Modal is currently open with edits, commit them to state.videos before exporting
  function commitOpenFormIfNeeded() {
    if (!els.adminModal || els.adminModal.classList.contains('hidden')) return;
    const title = els.formTitle ? els.formTitle.value.trim() : '';
    if (!title) return;
    const id = els.formVideoId ? els.formVideoId.value : '';
    const category = els.formCategory.value;
    const subTag = els.formSubTag.value.trim();
    const status = els.formStatus.value.trim();
    const year = els.formYear.value.trim() || '2026';
    const cover = els.formCover.value.trim();
    const desc = els.formDesc.value.trim();
    const episodes = Array.from(els.episodeRowsContainer.querySelectorAll('.ep-row')).map((row, idx) => ({
      name: row.querySelector('.ep-name-input').value.trim() || `第${idx + 1}集`,
      embed: row.querySelector('.ep-embed-input').value.trim()
    }));

    if (id) {
      const target = state.videos.find((v) => v.id === id);
      if (target) {
        target.title = title;
        target.category = category;
        target.subTag = subTag;
        target.status = status || `共 ${episodes.length} 集`;
        target.year = year;
        target.cover = cover;
        target.desc = desc;
        target.episodes = episodes;
        saveVideos();
      }
    }
  }

  function exportVideosJson() {
    commitOpenFormIfNeeded();
    downloadBlob(JSON.stringify(state.videos, null, 2), 'videos.json', 'application/json;charset=utf-8');
    showToast('已匯出 videos.json（請覆蓋 data/videos.json）', 'success');
  }

  function exportVideosJs() {
    commitOpenFormIfNeeded();
    const payload = {
      exportedAt: Date.now(),
      videos: state.videos
    };
    const content = 'window.S46SUB_DATA = ' + JSON.stringify(payload, null, 2) + ';\n';
    downloadBlob(content, 'videos.js', 'application/javascript;charset=utf-8');
    showToast('已匯出 videos.js（請覆蓋 data/videos.js 以供本機雙擊預覽）', 'success');
  }

  // Event Listeners
  window.addEventListener('scroll', () => {
    updateTopNavStyle();
    els.fabScrollTop.classList.toggle('hidden', window.scrollY < 260);
  });

  els.navLogoBtn.addEventListener('click', () => {
    state.searchQuery = '';
    els.heroSearchInput.value = '';
    els.innerSearchInput.value = '';
    renderHome();
  });

  document.addEventListener('click', (e) => {
    // Nav buttons
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
      if (navBtn.dataset.nav === 'home') {
        state.searchQuery = '';
        els.heroSearchInput.value = '';
        els.innerSearchInput.value = '';
        renderHome();
      } else if (navBtn.dataset.nav === 'category') {
        renderCategory(navBtn.dataset.cat);
      }
      return;
    }

    // Video card click -> Detail page
    const card = e.target.closest('.vod-card');
    if (card) {
      renderDetail(card.dataset.vodId);
      return;
    }

    // Latest filter tab
    const latestTab = e.target.closest('.latest-tab');
    if (latestTab) {
      state.latestFilter = latestTab.dataset.latestTab;
      renderHome();
      return;
    }

    // More category button
    const moreBtn = e.target.closest('.more-cat-btn');
    if (moreBtn) {
      renderCategory(moreBtn.dataset.moreCat);
      return;
    }

    // Subtag pill on category page
    const subPill = e.target.closest('.subtag-pill');
    if (subPill) {
      state.activeSubTag = subPill.dataset.subtag;
      renderCategoryGridOnly();
      return;
    }

    // Episode click on detail page
    const detailEp = e.target.closest('.detail-ep-btn');
    if (detailEp) {
      renderPlay(state.currentVideoId, parseInt(detailEp.dataset.playEp, 10) || 0);
      return;
    }

    // Episode click on player sidebar
    const sideEp = e.target.closest('.sidebar-ep-btn');
    if (sideEp) {
      renderPlay(state.currentVideoId, parseInt(sideEp.dataset.sidebarEp, 10) || 0);
      return;
    }

    // History item click
    const histBtn = e.target.closest('.hist-item');
    if (histBtn) {
      closeHistoryModal();
      renderPlay(histBtn.dataset.histVid, parseInt(histBtn.dataset.histEp, 10) || 0);
      return;
    }
  });

  // Search forms
  function handleSearch(query) {
    state.searchQuery = (query || '').trim();
    els.heroSearchInput.value = state.searchQuery;
    els.innerSearchInput.value = state.searchQuery;
    renderHome();
  }

  els.heroSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSearch(els.heroSearchInput.value);
  });

  els.innerSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSearch(els.innerSearchInput.value);
  });

  els.btnClearSearch.addEventListener('click', () => handleSearch(''));

  // Detail actions
  els.detailCatLink.addEventListener('click', () => {
    const v = state.videos.find((x) => x.id === state.currentVideoId);
    if (v) renderCategory(v.category);
  });
  els.btnDetailPlay.addEventListener('click', () => renderPlay(state.currentVideoId, 0));
  if (els.btnDetailEdit) els.btnDetailEdit.addEventListener('click', () => openAdminModal(state.currentVideoId));
  if (els.btnDetailAddEp) els.btnDetailAddEp.addEventListener('click', () => openAdminModal(state.currentVideoId));
  els.btnDetailShare.addEventListener('click', () => {
    const v = state.videos.find((x) => x.id === state.currentVideoId);
    if (v) copyText(`${v.title}（${v.category} - ${v.status}）`, '影片資訊');
  });

  // Player actions
  els.playCatLink.addEventListener('click', () => {
    const v = state.videos.find((x) => x.id === state.currentVideoId);
    if (v) renderCategory(v.category);
  });
  els.playDetailLink.addEventListener('click', () => renderDetail(state.currentVideoId));
  els.btnPlayMoreRelated.addEventListener('click', () => {
    const v = state.videos.find((x) => x.id === state.currentVideoId);
    renderCategory(v ? v.category : '電視冠番');
  });
  els.btnPlayNextEp.addEventListener('click', () => {
    renderPlay(state.currentVideoId, state.currentEpIndex + 1);
  });
  if (els.btnEditCurrentEmbed) els.btnEditCurrentEmbed.addEventListener('click', () => openAdminModal(state.currentVideoId));
  if (els.btnSidebarAddEp) els.btnSidebarAddEp.addEventListener('click', () => openAdminModal(state.currentVideoId));

  els.btnToggleSidebar.addEventListener('click', () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    if (state.sidebarCollapsed) {
      els.playLeftCol.className = 'lg:col-span-12 flex flex-col';
      els.playRightCol.classList.add('hidden');
      els.toggleSidebarIcon.setAttribute('data-lucide', 'chevron-left');
    } else {
      els.playLeftCol.className = 'lg:col-span-8 flex flex-col';
      els.playRightCol.classList.remove('hidden');
      els.toggleSidebarIcon.setAttribute('data-lucide', 'chevron-right');
    }
    if (window.lucide) lucide.createIcons();
  });

  // Admin Modal bindings (null-safe for exported visitor HTML)
  if (els.btnOpenAdmin) els.btnOpenAdmin.addEventListener('click', () => openAdminModal(null));
  if (els.btnQuickAddFromHome) els.btnQuickAddFromHome.addEventListener('click', () => openAdminModal(null));
  if (els.fabAddVideo) els.fabAddVideo.addEventListener('click', () => openAdminModal(null));
  if (els.btnAdminExportJson) els.btnAdminExportJson.addEventListener('click', exportVideosJson);
  if (els.btnCloseAdmin) els.btnCloseAdmin.addEventListener('click', closeAdminModal);
  if (els.btnCancelAdmin) els.btnCancelAdmin.addEventListener('click', closeAdminModal);
  if (els.btnAddEpisodeRow) els.btnAddEpisodeRow.addEventListener('click', () => {
    const count = els.episodeRowsContainer.querySelectorAll('.ep-row').length;
    addEpisodeRow(`第${String(count + 1).padStart(2, '0')}集`, '');
  });

  if (els.videoForm) els.videoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = els.formVideoId.value;
    const title = els.formTitle.value.trim();
    const category = els.formCategory.value;
    const subTag = els.formSubTag.value.trim();
    const status = els.formStatus.value.trim();
    const year = els.formYear.value.trim() || '2026';
    const cover = els.formCover.value.trim();
    const desc = els.formDesc.value.trim();

    const episodes = Array.from(els.episodeRowsContainer.querySelectorAll('.ep-row')).map((row, idx) => ({
      name: row.querySelector('.ep-name-input').value.trim() || `第${idx + 1}集`,
      embed: row.querySelector('.ep-embed-input').value.trim()
    }));

    if (id) {
      const target = state.videos.find((v) => v.id === id);
      if (target) {
        target.title = title;
        target.category = category;
        target.subTag = subTag;
        target.status = status || `共 ${episodes.length} 集`;
        target.year = year;
        target.cover = cover;
        target.desc = desc;
        target.episodes = episodes;
      }
      saveVideos();
      closeAdminModal();
      showToast('已更新影片與 OneDrive 內嵌碼', 'success');
      renderPlay(id, Math.min(state.currentEpIndex, episodes.length - 1));
    } else {
      const newVod = {
        id: 'vod-' + Date.now(),
        title,
        category,
        subTag,
        status: status || `共 ${episodes.length} 集`,
        year,
        cover,
        desc,
        episodes
      };
      state.videos.unshift(newVod);
      saveVideos();
      closeAdminModal();
      showToast('已上架新影片！', 'success');
      renderPlay(newVod.id, 0);
    }
  });

  if (els.btnDeleteVideo) els.btnDeleteVideo.addEventListener('click', () => {
    const id = els.formVideoId.value;
    if (!id) return;
    state.videos = state.videos.filter((v) => v.id !== id);
    saveVideos();
    closeAdminModal();
    showToast('已刪除影片', 'info');
    renderHome();
  });

  // Import JSON
  if (els.importJsonFile) els.importJsonFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(String(reader.result || '[]'));
        if (!Array.isArray(arr) || arr.length === 0) throw new Error('empty');
        state.videos = arr.filter((v) => v && v.title && Array.isArray(v.episodes));
        saveVideos();
        closeAdminModal();
        renderHome();
        showToast(`已成功匯入 ${state.videos.length} 部影片`, 'success');
      } catch (err) {
        showToast('JSON 格式不正確，匯入失敗', 'error');
      }
      els.importJsonFile.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  });

  // Notice, History, Mobile Menu, Export, ScrollTop
  els.btnOpenNotice.addEventListener('click', () => {
    els.noticeModal.classList.remove('hidden');
    els.noticeModal.classList.add('flex');
  });
  els.btnCloseNotice.addEventListener('click', () => {
    els.noticeModal.classList.add('hidden');
    els.noticeModal.classList.remove('flex');
  });

  els.btnHistory.addEventListener('click', openHistoryModal);
  els.btnCloseHistory.addEventListener('click', closeHistoryModal);
  els.btnClearHistory.addEventListener('click', () => {
    state.history = [];
    saveHistory();
    openHistoryModal();
    showToast('已清空觀看紀錄', 'info');
  });

  els.btnMobileMenu.addEventListener('click', () => {
    els.mobileNavMenu.classList.toggle('hidden');
  });

  if (els.btnFooterExportVideosJson) els.btnFooterExportVideosJson.addEventListener('click', exportVideosJson);
  if (els.btnFooterExportVideosJs) els.btnFooterExportVideosJs.addEventListener('click', exportVideosJs);
  els.fabScrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Init
  async function init() {
    await loadData();
    renderHome();
    if (window.lucide) lucide.createIcons();
  }
  init();
})();
