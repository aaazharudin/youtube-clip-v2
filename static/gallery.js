// Gallery Page JavaScript

let allClips = [];
let currentEditingClipId = null;
let selectedClips = new Set(); // Track selected clips for bulk upload

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
  if (selectedClips.has(clip.id)) {
    card.classList.add('selected');
  }
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
  
  // Upload status badge
  let uploadStatusHtml = '';
  if (clip.uploaded_to_youtube) {
    uploadStatusHtml = `
      <div class="upload-status uploaded" title="Uploaded to YouTube">
        <span>✅ Uploaded to YouTube</span>
        ${clip.youtube_url ? `<a href="${clip.youtube_url}" target="_blank" class="youtube-link">🔗 Buka Video</a>` : ''}
      </div>
    `;
  }

  card.innerHTML = `
    <div class="clip-thumbnail">
      ${!clip.uploaded_to_youtube ? `
        <input type="checkbox" 
          class="clip-checkbox" 
          ${selectedClips.has(clip.id) ? 'checked' : ''}
          onchange="toggleClipSelection('${clip.id}', event)"
          onclick="event.stopPropagation()">
      ` : ''}
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
      ${uploadStatusHtml}
      ${tagsHtml ? `<div class="clip-tags">${tagsHtml}</div>` : ''}
      <div class="clip-actions">
        <button class="btn icon" data-action="upload-youtube" data-clip-id="${clip.id}" title="${clip.uploaded_to_youtube ? 'Already uploaded to YouTube' : 'Upload to YouTube Shorts'}" ${clip.uploaded_to_youtube ? 'disabled' : ''}>
          ${clip.uploaded_to_youtube ? '✅' : '📤'}
        </button>
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
        case 'upload-youtube':
          uploadToYouTube(clipId);
          break;
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
  alert('❌ ' + message);
}

function showSuccess(message) {
  alert('✅ ' + message);
}

function showInfo(message) {
  alert('ℹ️ ' + message);
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

// Upload clip to YouTube
// Debounce tracker untuk prevent double upload
const uploadingClips = new Set();

async function uploadToYouTube(clipId) {
  const clip = allClips.find(c => c.id === clipId);
  if (!clip) {
    showError('Clip not found');
    return;
  }
  
  // PREVENT DOUBLE UPLOAD: Check if already uploading
  if (uploadingClips.has(clipId)) {
    alert('⏳ Upload sedang berjalan...\n\nSilakan tunggu sampai selesai.');
    return;
  }
  
  // Check if already uploaded
  if (clip.uploaded_to_youtube) {
    if (clip.youtube_url) {
      if (confirm('Clip sudah di-upload ke YouTube.\n\nBuka video sekarang?')) {
        window.open(clip.youtube_url, '_blank');
      }
    } else {
      alert('Clip sudah di-upload ke YouTube.');
    }
    return;
  }

  if (!confirm(`Upload "${clip.title}" ke YouTube Shorts?\n\nPastikan OAuth sudah setup.`)) {
    return;
  }

  // Find the upload button and disable it
  const uploadBtn = document.querySelector(`[data-action="upload-youtube"][data-clip-id="${clipId}"]`);
  const originalText = uploadBtn ? uploadBtn.innerHTML : '';
  
  // Mark as uploading
  uploadingClips.add(clipId);
  
  try {
    // Show loading state
    if (uploadBtn) {
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = '⏳';
      uploadBtn.title = 'Uploading... Tunggu 1-2 menit';
    }
    
    const response = await fetch(`/api/gallery/${clipId}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platforms: ['youtube']
      })
    });

    const data = await response.json();
    if (data.ok) {
      const result = data.result;
      if (result.youtube && result.youtube.success) {
        // Success!
        const url = result.youtube.url;
        
        // Update local clip data
        clip.uploaded_to_youtube = true;
        clip.youtube_url = url;
        
        // Refresh gallery to show updated status
        renderGallery();
        
        // Show success message with clickable link
        const openNow = confirm(
          '✅ BERHASIL DI-UPLOAD!\n\n' +
          `Video "${clip.title}" sudah live di YouTube Shorts!\n\n` +
          `URL: ${url}\n\n` +
          `Klik OK untuk membuka video sekarang.`
        );
        
        if (openNow) {
          window.open(url, '_blank');
        }
      } else {
        const error = result.youtube?.error || 'Upload failed';
        
        // Reset button
        if (uploadBtn) {
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = originalText;
          uploadBtn.title = 'Upload to YouTube Shorts';
        }
        
        alert(
          '❌ UPLOAD GAGAL\n\n' +
          `Error: ${error}\n\n` +
          `Coba lagi atau periksa OAuth setup di YOUTUBE_SETUP.md`
        );
      }
    } else {
      // Reset button
      if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = originalText;
        uploadBtn.title = 'Upload to YouTube Shorts';
      }
      
      alert(
        '❌ UPLOAD GAGAL\n\n' +
        `Error: ${data.error}\n\n` +
        `Coba lagi atau periksa OAuth setup.`
      );
    }
  } catch (error) {
    console.error('Failed to upload:', error);
    
    // Reset button
    if (uploadBtn) {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = originalText;
      uploadBtn.title = 'Upload to YouTube Shorts';
    }
    
    alert(
      '❌ ERROR\n\n' +
      `${error.message}\n\n` +
      `Periksa koneksi internet atau coba lagi.`
    );
  } finally {
    // ALWAYS remove from uploading set
    uploadingClips.delete(clipId);
  }
}

// ========================================
// BULK UPLOAD SYSTEM
// ========================================

// Upload Queue Manager
class UploadQueue {
  constructor(maxConcurrent = 2) {
    this.queue = [];
    this.uploading = new Map(); // clipId -> upload state
    this.completed = [];
    this.failed = [];
    this.maxConcurrent = maxConcurrent;
    this.isPaused = false;
  }

  add(clipId, clip) {
    if (this.uploading.has(clipId) || this.completed.find(c => c.id === clipId)) {
      return; // Already queued or completed
    }
    this.queue.push({ id: clipId, clip, addedAt: Date.now() });
  }

  addBatch(clipIds) {
    clipIds.forEach(id => {
      const clip = allClips.find(c => c.id === id);
      if (clip && !clip.uploaded_to_youtube) {
        this.add(id, clip);
      }
    });
  }

  async start() {
    this.isPaused = false;
    while (this.queue.length > 0 && !this.isPaused) {
      // Wait if too many concurrent uploads
      while (this.uploading.size >= this.maxConcurrent && !this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (this.isPaused) break;

      const item = this.queue.shift();
      if (item) {
        this.uploadItem(item);
      }
    }
  }

  async uploadItem(item) {
    const { id, clip } = item;
    
    this.uploading.set(id, {
      clip,
      status: 'uploading',
      progress: 0,
      startedAt: Date.now()
    });

    updateUploadProgressUI();

    try {
      // Simulate progress updates (estimate based on file size)
      const progressInterval = this.simulateProgress(id, clip.file_size || 5000000);

      // Actual upload
      const response = await fetch(`/api/gallery/${id}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: ['youtube'] })
      });

      clearInterval(progressInterval);

      const data = await response.json();
      
      if (data.ok && data.result.youtube?.success) {
        // Success
        this.uploading.get(id).progress = 100;
        this.uploading.get(id).status = 'completed';
        this.completed.push({
          id,
          clip,
          url: data.result.youtube.url,
          completedAt: Date.now()
        });

        // Update clip data
        const clipData = allClips.find(c => c.id === id);
        if (clipData) {
          clipData.uploaded_to_youtube = true;
          clipData.youtube_url = data.result.youtube.url;
        }
      } else {
        // Failed
        const error = data.result?.youtube?.error || data.error || 'Upload failed';
        this.uploading.get(id).status = 'failed';
        this.uploading.get(id).error = error;
        this.failed.push({ id, clip, error, failedAt: Date.now() });
      }
    } catch (error) {
      // Error
      this.uploading.get(id).status = 'failed';
      this.uploading.get(id).error = error.message;
      this.failed.push({ id, clip, error: error.message, failedAt: Date.now() });
    }

    updateUploadProgressUI();

    // Move to completed/failed after short delay
    setTimeout(() => {
      this.uploading.delete(id);
      updateUploadProgressUI();
    }, 2000);
  }

  simulateProgress(clipId, fileSize) {
    // Estimate upload time based on file size (slower for larger files)
    const estimatedTime = Math.max(30000, (fileSize / 1024 / 1024) * 10000); // ~10s per MB
    const increment = 100 / (estimatedTime / 1000); // Progress per second

    return setInterval(() => {
      const state = this.uploading.get(clipId);
      if (state && state.progress < 90) {
        state.progress = Math.min(90, state.progress + increment);
        updateUploadProgressUI();
      }
    }, 1000);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.start();
  }

  clear() {
    this.queue = [];
    this.uploading.clear();
    this.completed = [];
    this.failed = [];
  }

  getStats() {
    return {
      queued: this.queue.length,
      uploading: this.uploading.size,
      completed: this.completed.length,
      failed: this.failed.length,
      total: this.queue.length + this.uploading.size + this.completed.length + this.failed.length
    };
  }
}

// Global upload queue instance
let uploadQueue = null;

// Toggle clip selection
function toggleClipSelection(clipId, event) {
  event.stopPropagation();
  
  if (selectedClips.has(clipId)) {
    selectedClips.delete(clipId);
  } else {
    selectedClips.add(clipId);
  }
  
  updateBulkActionBar();
  renderGallery(); // Re-render to update visual selection
}

// Select all clips
function selectAllClips() {
  allClips.forEach(clip => {
    if (!clip.uploaded_to_youtube) {
      selectedClips.add(clip.id);
    }
  });
  updateBulkActionBar();
  renderGallery();
}

// Deselect all clips
function deselectAllClips() {
  selectedClips.clear();
  updateBulkActionBar();
  renderGallery();
}

// Update bulk action bar
function updateBulkActionBar() {
  let bulkBar = document.getElementById('bulkActionBar');
  
  if (selectedClips.size === 0) {
    if (bulkBar) {
      bulkBar.classList.add('hide');
    }
    return;
  }

  if (!bulkBar) {
    bulkBar = document.createElement('div');
    bulkBar.id = 'bulkActionBar';
    bulkBar.className = 'bulk-action-bar';
    document.body.appendChild(bulkBar);
  }

  bulkBar.className = 'bulk-action-bar';
  bulkBar.innerHTML = `
    <span class="selection-count">${selectedClips.size} clip${selectedClips.size > 1 ? 's' : ''} dipilih</span>
    <div class="divider"></div>
    <button class="btn" onclick="uploadSelectedClips()">📤 Upload ke YouTube</button>
    <button class="btn" onclick="selectAllClips()">✅ Pilih Semua</button>
    <button class="btn" onclick="deselectAllClips()">✖️ Batal Pilih</button>
  `;
}

// Upload selected clips
async function uploadSelectedClips() {
  if (selectedClips.size === 0) {
    alert('Tidak ada clip yang dipilih');
    return;
  }

  // Filter out already uploaded clips
  const clipsToUpload = Array.from(selectedClips).filter(id => {
    const clip = allClips.find(c => c.id === id);
    return clip && !clip.uploaded_to_youtube;
  });

  if (clipsToUpload.length === 0) {
    alert('Semua clip yang dipilih sudah di-upload');
    return;
  }

  if (!confirm(`Upload ${clipsToUpload.length} video ke YouTube?\n\nPastikan OAuth sudah setup.`)) {
    return;
  }

  // Create upload queue
  uploadQueue = new UploadQueue(2); // Max 2 concurrent uploads
  uploadQueue.addBatch(clipsToUpload);

  // Show progress modal
  showUploadProgressModal();

  // Start uploading
  uploadQueue.start();

  // Clear selection
  deselectAllClips();
}

// Show upload progress modal
function showUploadProgressModal() {
  let modal = document.getElementById('uploadProgressModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'uploadProgressModal';
    modal.className = 'upload-progress-modal';
    modal.innerHTML = `
      <div class="upload-progress-container">
        <div class="upload-progress-header">
          <h3>📤 Upload Progress</h3>
          <button class="close-btn" onclick="closeUploadProgressModal()">✖️</button>
        </div>
        <div class="upload-progress-body" id="uploadProgressBody">
          <!-- Progress items will be added here -->
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeUploadProgressModal();
      }
    });
  }

  modal.classList.remove('hide');
  updateUploadProgressUI();
}

// Close upload progress modal
function closeUploadProgressModal() {
  const modal = document.getElementById('uploadProgressModal');
  if (modal) {
    modal.classList.add('hide');
  }
}

// Update upload progress UI
function updateUploadProgressUI() {
  const body = document.getElementById('uploadProgressBody');
  if (!body || !uploadQueue) return;

  const stats = uploadQueue.getStats();
  let html = '';

  // Summary stats box
  if (stats.total > 0) {
    html = `
      <div class="upload-summary">
        <div class="upload-summary-title">📊 Summary</div>
        <div class="upload-summary-stats">
          <div class="upload-summary-stat queued">
            <span>⏳</span>
            <span>Queued: ${stats.queued}</span>
          </div>
          <div class="upload-summary-stat uploading">
            <span>📤</span>
            <span>Uploading: ${stats.uploading}</span>
          </div>
          <div class="upload-summary-stat completed">
            <span>✅</span>
            <span>Done: ${stats.completed}</span>
          </div>
          <div class="upload-summary-stat failed">
            <span>❌</span>
            <span>Failed: ${stats.failed}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Show queued items
  uploadQueue.queue.forEach(item => {
    html += createUploadItemHTML(item.id, item.clip, 'queued', 0);
  });

  // Show uploading items
  uploadQueue.uploading.forEach((state, clipId) => {
    html += createUploadItemHTML(clipId, state.clip, state.status, state.progress, state.error);
  });

  // Show completed items
  uploadQueue.completed.forEach(item => {
    html += createUploadItemHTML(item.id, item.clip, 'completed', 100, null, item.url);
  });

  // Show failed items
  uploadQueue.failed.forEach(item => {
    html += createUploadItemHTML(item.id, item.clip, 'failed', 0, item.error);
  });

  body.innerHTML = html || '<div style="padding: 3rem; text-align: center; color: var(--muted); font-size: 1.1rem;">🎬 Tidak ada upload yang sedang berjalan</div>';
}

// Create upload item HTML
function createUploadItemHTML(clipId, clip, status, progress, error, url) {
  const icons = {
    queued: '⏳',
    uploading: '📤',
    completed: '✅',
    failed: '❌'
  };

  const statusText = {
    queued: 'Menunggu...',
    uploading: `Uploading... ${Math.round(progress)}%`,
    completed: 'Upload berhasil!',
    failed: 'Upload gagal'
  };

  return `
    <div class="upload-item ${status}">
      <div class="upload-item-header">
        <div class="upload-item-icon">${icons[status]}</div>
        <div class="upload-item-info">
          <div class="upload-item-title">${escapeHtml(clip.title || 'Untitled')}</div>
          <div class="upload-item-status">${statusText[status]}</div>
        </div>
      </div>
      ${status === 'uploading' || status === 'completed' ? `
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: ${progress}%"></div>
        </div>
      ` : ''}
      ${error ? `<div class="upload-item-error">⚠️ ${escapeHtml(error)}</div>` : ''}
      ${url ? `
        <div class="upload-item-actions">
          <a href="${url}" target="_blank" class="btn">🔗 Buka Video</a>
        </div>
      ` : ''}
    </div>
  `;
}

// Enhanced upload progress/status display
function showUploadProgress(message, type = 'info', url = null) {
  // For now, use enhanced alert
  // type can be: 'info', 'success', 'error'
  
  if (type === 'success' && url) {
    // Show success with option to open URL
    if (confirm(message)) {
      window.open(url, '_blank');
    }
  } else if (type === 'error') {
    alert(message);
  } else {
    // Info message (uploading...)
    // For uploading state, we just update button, no alert needed
    console.log(message);
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
