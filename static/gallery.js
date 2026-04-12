// Gallery Page JavaScript

let allClips = [];
let currentEditingClipId = null;

// DOM Elements
const galleryGrid = document.getElementById('galleryGrid');
const totalClipsEl = document.getElementById('totalClips');
const totalSizeEl = document.getElementById('totalSize');
const lastUpdateEl = document.getElementById('lastUpdate');
const searchInput = document.getElementById('searchClips');
const sortSelect = document.getElementById('sortClips');
const filterTagSelect = document.getElementById('filterTag');
const refreshBtn = document.getElementById('refreshBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const editModal = document.getElementById('editModal');
const editTitleInput = document.getElementById('editTitleInput');

// Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format timestamp to readable date
function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format duration
function formatDuration(seconds) {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

// Fetch all clips from API
async function fetchClips() {
  try {
    const response = await fetch('/api/gallery');
    const data = await response.json();
    if (data.ok) {
      allClips = data.clips || [];
      updateStats();
      renderGallery();
    }
  } catch (error) {
    console.error('Failed to fetch clips:', error);
    showError('Gagal memuat klip');
  }
}

// Update stats bar
function updateStats() {
  const total = allClips.length;
  const totalSize = allClips.reduce((sum, clip) => sum + (clip.file_size || 0), 0);
  const lastUpdate = allClips.length > 0 ? allClips[0].created_at : null;

  totalClipsEl.textContent = total;
  totalSizeEl.textContent = formatBytes(totalSize);
  lastUpdateEl.textContent = lastUpdate ? formatDate(lastUpdate) : '-';
}

// Render gallery grid
function renderGallery() {
  let filteredClips = [...allClips];

  // Apply search filter
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filteredClips = filteredClips.filter(clip =>
      clip.title?.toLowerCase().includes(searchTerm) ||
      clip.source_title?.toLowerCase().includes(searchTerm)
    );
  }

  // Apply tag filter
  const tagFilter = filterTagSelect.value;
  if (tagFilter !== 'all') {
    filteredClips = filteredClips.filter(clip =>
      clip.tags?.includes(tagFilter)
    );
  }

  // Apply sort
  const sortBy = sortSelect.value;
  switch (sortBy) {
    case 'oldest':
      filteredClips.sort((a, b) => a.created_at - b.created_at);
      break;
    case 'largest':
      filteredClips.sort((a, b) => (b.file_size || 0) - (a.file_size || 0));
      break;
    case 'smallest':
      filteredClips.sort((a, b) => (a.file_size || 0) - (b.file_size || 0));
      break;
    case 'newest':
    default:
      filteredClips.sort((a, b) => b.created_at - a.created_at);
  }

  // Clear grid
  galleryGrid.innerHTML = '';

  // Show empty state or clips
  if (filteredClips.length === 0) {
    galleryGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📹</div>
        <div class="empty-title">${allClips.length === 0 ? 'Belum ada klip' : 'Tidak ada klip yang cocok'}</div>
        <div class="empty-desc">${allClips.length === 0 ? 'Buat klip pertama Anda dari halaman Creator' : 'Coba ubah filter atau pencarian'}</div>
        ${allClips.length === 0 ? '<a href="/" class="btn">Go to Creator</a>' : ''}
      </div>
    `;
    return;
  }

  // Render clip cards
  filteredClips.forEach(clip => {
    const card = createClipCard(clip);
    galleryGrid.appendChild(card);
  });
}

// Create clip card element
function createClipCard(clip) {
  const card = document.createElement('div');
  card.className = 'clip-card';
  // Store clip data on the card element for safe access
  card.dataset.clipId = clip.id;
  card.dataset.clipFilename = clip.filename;

  // Encode filename properly for URL
  const encodedFilename = encodeURIComponent(clip.filename);
  const videoUrl = `/clips/gallery/${clip.id}/${encodedFilename}`;
  const downloadUrl = `/clips/gallery/${clip.id}/${encodedFilename}`;

  const tagsHtml = (clip.tags || []).map(tag =>
    `<span class="tag">${getTagEmoji(tag)} ${tag}</span>`
  ).join('');

  const videoId = `video-${clip.id}`;

  card.innerHTML = `
    <div class="clip-thumbnail">
      <video id="${videoId}" src="${videoUrl}" preload="metadata" playsinline></video>
      <div class="video-overlay">
        <button class="play-btn" data-action="play" data-video-id="${videoId}">▶️</button>
        <div class="preview-hint">Klik untuk preview besar</div>
      </div>
      <div class="video-controls">
        <button class="control-btn" data-action="mute" data-video-id="${videoId}" title="Toggle Mute">🔊</button>
        <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1" data-action="volume" data-video-id="${videoId}">
        <button class="control-btn" data-action="fullscreen" title="Full Screen">⛶</button>
      </div>
    </div>
    <div class="clip-info">
      <div class="clip-title" title="${escapeHtml(clip.title || 'Untitled')}">${escapeHtml(clip.title || 'Untitled')}</div>
      <div class="clip-meta">
        <span>⏱️ ${formatDuration(clip.duration)}</span>
        <span>📦 ${formatBytes(clip.file_size || 0)}</span>
      </div>
      <div class="clip-source" title="${escapeHtml(clip.source_title || '')}">
        ${escapeHtml(clip.source_title || 'Unknown Source')}
      </div>
      ${tagsHtml ? `<div class="clip-tags">${tagsHtml}</div>` : ''}
      <div class="clip-actions">
        <button class="btn icon" data-action="delete" data-clip-id="${clip.id}" title="Delete">🗑️</button>
        <button class="btn icon" data-action="edit" data-clip-id="${clip.id}" title="Edit Title">✏️</button>
        <a href="${downloadUrl}" download class="btn">⬇️ Download</a>
      </div>
    </div>
  `;

  // Add event listeners for card interactions
  const thumbnail = card.querySelector('.clip-thumbnail');

  // Handle thumbnail click for full screen preview
  thumbnail.addEventListener('click', () => {
    const clipId = card.dataset.clipId;
    const filename = card.dataset.clipFilename;
    openVideoPreview(clipId, filename);
  });

  // Handle control button clicks
  thumbnail.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const videoId = btn.dataset.videoId;
      const clipId = card.dataset.clipId;
      const filename = card.dataset.clipFilename;

      switch (action) {
        case 'play':
          toggleVideoPlay(videoId);
          break;
        case 'mute':
          toggleVideoMute(videoId);
          break;
        case 'volume':
          // Volume change is handled by onchange event
          break;
        case 'fullscreen':
          openVideoPreview(clipId, filename);
          break;
      }
    });

    // Handle volume slider change
    if (btn.dataset.action === 'volume') {
      btn.addEventListener('change', (e) => {
        e.stopPropagation();
        setVolume(btn.dataset.videoId, btn.value);
      });
    }
  });

  // Handle action buttons (delete, edit)
  card.querySelectorAll('.clip-actions [data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const action = btn.dataset.action;
      const clipId = btn.dataset.clipId;

      switch (action) {
        case 'delete':
          deleteClip(clipId);
          break;
        case 'edit':
          openEditModal(clipId);
          break;
      }
    });
  });

  // Add event listeners for video
  const video = card.querySelector('video');
  const playBtn = card.querySelector('.play-btn');

  if (video) {
    video.addEventListener('loadstart', () => {
      console.log('Video loading:', clip.filename);
    });

    video.addEventListener('canplay', () => {
      console.log('Video can play:', clip.filename);
    });

    video.addEventListener('error', (e) => {
      console.error('Video error:', clip.filename, e);
      // Show error in thumbnail
      video.style.display = 'none';
      const thumb = card.querySelector('.clip-thumbnail');
      thumb.innerHTML += `<div class="video-error">❌ Video gagal dimuat</div>`;
    });

    video.addEventListener('play', () => {
      playBtn.textContent = '⏸️';
    });

    video.addEventListener('pause', () => {
      playBtn.textContent = '▶️';
    });

    video.addEventListener('ended', () => {
      playBtn.textContent = '▶️';
    });
  }

  return card;
}

// Toggle video play/pause
function toggleVideoPlay(videoId) {
  const video = document.getElementById(videoId);
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
}

// Toggle video mute
function toggleVideoMute(videoId) {
  const video = document.getElementById(videoId);
  const controlBtn = document.querySelector(`#${videoId}`).parentElement.querySelector('.control-btn');

  video.muted = !video.muted;
  controlBtn.textContent = video.muted ? '🔇' : '🔊';
}

// Set video volume
function setVolume(videoId, volume) {
  const video = document.getElementById(videoId);
  video.volume = volume;
  video.muted = false;
}

// Open video preview modal
function openVideoPreview(clipId, filename) {
  console.log('openVideoPreview called with:', { clipId, filename });

  const clip = allClips.find(c => c.id === clipId);
  if (!clip) {
    console.error('Clip not found:', clipId, 'Available clips:', allClips.map(c => c.id));
    return;
  }

  // Use clip's actual filename from the database
  const actualFilename = clip.filename;
  const encodedFilename = encodeURIComponent(actualFilename);
  const videoUrl = `/clips/gallery/${clipId}/${encodedFilename}`;

  console.log('Video URL details:', {
    clipId,
    actualFilename,
    encodedFilename,
    videoUrl,
    clipTitle: clip.title
  });

  const modal = document.getElementById('previewModal');
  const modalVideo = document.getElementById('previewVideo');

  if (!modal) {
    console.error('Modal element not found');
    return;
  }
  if (!modalVideo) {
    console.error('Modal video element not found');
    return;
  }

  console.log('Modal and video elements found, opening...');
  console.log('🔍 Modal element:', modal);
  console.log('🔍 Modal classes:', modal.className);
  console.log('🔍 Modal id:', modal.id);

  // Check if CSS is loaded by checking a specific property
  const testDiv = document.createElement('div');
  testDiv.className = 'video-modal';
  document.body.appendChild(testDiv);
  const testStyles = getComputedStyle(testDiv);
  console.log('🔍 CSS Test - video-modal position:', testStyles.position, 'z-index:', testStyles.zIndex);
  document.body.removeChild(testDiv);

  // Prevent body scrolling - SIMPLER approach
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100vw';
  document.body.style.overflow = 'hidden';

  // Store scroll position for restoration
  modal.dataset.scrollY = scrollY;

  // Reset video state completely
  modalVideo.pause();
  modalVideo.removeAttribute('src');
  modalVideo.load();

  // Clear any previous event listeners
  modalVideo.onloadedmetadata = null;
  modalVideo.onerror = null;
  modalVideo.oncanplay = null;
  modalVideo.onloadstart = null;

  // Remove any existing error messages
  const existingError = modalVideo.parentElement.querySelector('.video-error');
  if (existingError) {
    existingError.remove();
  }

  // Show modal and FORCE inline styles as fallback
  modal.classList.remove('hide');

  // Force critical styles inline as fallback (in case CSS not loading)
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.zIndex = '9999';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.background = 'rgba(0, 0, 0, 0.95)';
  modal.style.padding = '0';

  // Force video element styles - YouTube Shorts style (vertical video)
  modalVideo.style.display = 'block';
  modalVideo.style.height = '100vh';
  modalVideo.style.width = 'auto';
  modalVideo.style.maxWidth = '100vw';

  console.log('🔨 Forced inline styles on modal and video');

  // Log classes after removing hide
  console.log('🔍 Modal classes after removing hide:', modal.className);

  // Log modal state for debugging
  setTimeout(() => {
    const modalStyles = getComputedStyle(modal);
    const videoStyles = getComputedStyle(modalVideo);
    console.log('🎯 Modal state after showing:', {
      modalDisplay: modalStyles.display,
      modalZIndex: modalStyles.zIndex,
      modalPosition: modalStyles.position,
      modalWidth: modalStyles.width,
      modalHeight: modalStyles.height,
      videoDisplay: videoStyles.display,
      videoZIndex: videoStyles.zIndex,
      videoWidth: modalVideo.offsetWidth,
      videoHeight: modalVideo.offsetHeight
    });
  }, 50);

  console.log('Modal shown, setting video source...');

  // Load video immediately - DON'T add source tag, just set src
  modalVideo.src = videoUrl;

  // Force a reflow to ensure the modal is visible
  void modal.offsetWidth;

  console.log('Video src set to:', modalVideo.src);

  // Set up event listeners
  modalVideo.onloadedmetadata = () => {
    console.log('✅ Video metadata loaded successfully!');
    console.log('📐 Video dimensions:', modalVideo.videoWidth, 'x', modalVideo.videoHeight);
    console.log('📦 Video element size:', modalVideo.offsetWidth, 'x', modalVideo.offsetHeight);
    console.log('🎨 Video element styles:', {
      display: getComputedStyle(modalVideo).display,
      visibility: getComputedStyle(modalVideo).visibility,
      opacity: getComputedStyle(modalVideo).opacity,
      zIndex: getComputedStyle(modalVideo).zIndex,
      position: getComputedStyle(modalVideo).position,
      width: getComputedStyle(modalVideo).width,
      height: getComputedStyle(modalVideo).height
    });
    console.log('🖼️ Modal styles:', {
      display: getComputedStyle(modal).display,
      zIndex: getComputedStyle(modal).zIndex
    });
    modalVideo.play().catch(e => {
      console.log('⚠️ Auto-play prevented:', e);
    });
  };

  modalVideo.oncanplay = () => {
    console.log('✅ Video can play!');
    console.log('🎬 Video element:', modalVideo);
    console.log('🎬 Video visible?', modalVideo.offsetWidth > 0 && modalVideo.offsetHeight > 0);
  };

  modalVideo.onloadstart = () => {
    console.log('📡 Video loading started...');
  };

  modalVideo.onerror = (e) => {
    console.error('❌ Video failed to load:', e);
    console.error('Video error details:', modalVideo.error);
    console.error('URL was:', videoUrl);

    modalVideo.style.display = 'none';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'video-error';
    errorDiv.style.zIndex = '1000';
    errorDiv.innerHTML = `
      ❌ Video gagal dimuat<br>
      <small>URL: ${videoUrl}</small><br>
      <small>Error: ${modalVideo.error?.message || 'Unknown error'}</small><br>
      <button class="btn" style="margin-top:0.5rem" onclick="closeVideoPreview()">Tutup</button>
    `;
    modalVideo.parentElement.appendChild(errorDiv);
  };

  console.log('Video element setup complete. Element:', modalVideo);
}

// Close video preview modal
function closeVideoPreview() {
  const modal = document.getElementById('previewModal');
  const modalVideo = document.getElementById('previewVideo');

  if (modal && modalVideo) {
    modalVideo.pause();
    modalVideo.src = '';
    modal.classList.add('hide');

    // Clear forced inline styles
    modal.style.position = '';
    modal.style.inset = '';
    modal.style.zIndex = '';
    modal.style.display = '';
    modal.style.alignItems = '';
    modal.style.justifyContent = '';
    modal.style.background = '';
    modal.style.padding = '';

    modalVideo.style.maxWidth = '';
    modalVideo.style.maxHeight = '';
    modalVideo.style.objectFit = '';

    // Restore body scrolling
    const scrollY = parseInt(modal.dataset.scrollY || '0');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollY);

    console.log('Modal closed, scroll restored to:', scrollY);
  }
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('previewModal');
    if (modal && !modal.classList.contains('hide')) {
      closeVideoPreview();
    }
    closeEditModal();
  }
});

// Get tag emoji
function getTagEmoji(tag) {
  const emojis = {
    viral: '🔥',
    funny: '😂',
    tutorial: '📚'
  };
  return emojis[tag] || '🏷️';
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show error message
function showError(message) {
  // Simple alert for now, could be enhanced with toast notification
  alert(message);
}

// Open edit modal
function openEditModal(clipId) {
  const clip = allClips.find(c => c.id === clipId);
  if (!clip) return;

  currentEditingClipId = clipId;
  editTitleInput.value = clip.title || '';
  editModal.classList.remove('hide');
  editTitleInput.focus();
}

// Close edit modal
function closeEditModal() {
  editModal.classList.add('hide');
  currentEditingClipId = null;
}

// Use template
function useTemplate(template) {
  editTitleInput.value = template;
  editTitleInput.focus();
}

// Save title
async function saveTitle() {
  if (!currentEditingClipId) return;

  const newTitle = editTitleInput.value.trim();
  if (!newTitle) {
    alert('Judul tidak boleh kosong');
    return;
  }

  try {
    const response = await fetch(`/api/gallery/${currentEditingClipId}/title`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: newTitle })
    });

    const data = await response.json();
    if (data.ok) {
      // Update local data
      const clip = allClips.find(c => c.id === currentEditingClipId);
      if (clip) {
        clip.title = newTitle;
      }
      renderGallery();
      closeEditModal();
    } else {
      showError(data.error || 'Gagal menyimpan judul');
    }
  } catch (error) {
    console.error('Failed to save title:', error);
    showError('Gagal menyimpan judul');
  }
}

// Delete clip
async function deleteClip(clipId) {
  if (!confirm('Yakin ingin menghapus klip ini?')) return;

  try {
    const response = await fetch(`/api/gallery/${clipId}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    if (data.ok) {
      allClips = allClips.filter(c => c.id !== clipId);
      updateStats();
      renderGallery();
    } else {
      showError(data.error || 'Gagal menghapus klip');
    }
  } catch (error) {
    console.error('Failed to delete clip:', error);
    showError('Gagal menghapus klip');
  }
}

// Download all clips (as individual files for now)
function downloadAll() {
  if (allClips.length === 0) {
    alert('Tidak ada klip untuk diunduh');
    return;
  }

  // Download each clip
  allClips.forEach((clip, index) => {
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = `/clips/gallery/${clip.id}/${clip.filename}`;
      link.download = `${clip.title || 'clip'}.mp4`;
      link.click();
    }, index * 500); // Delay each download by 500ms
  });
}

// Event listeners
searchInput.addEventListener('input', renderGallery);
sortSelect.addEventListener('change', renderGallery);
filterTagSelect.addEventListener('change', renderGallery);
refreshBtn.addEventListener('click', fetchClips);
downloadAllBtn.addEventListener('click', downloadAll);

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !editModal.classList.contains('hide')) {
    closeEditModal();
  }
});

// Close modal on backdrop click
editModal.querySelector('.modalBackdrop').addEventListener('click', closeEditModal);

// Initialize
fetchClips();
