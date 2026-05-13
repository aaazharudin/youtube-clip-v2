# 🎨 Bulk Upload Feature - Visual Guide

## 📸 UI Components Breakdown

### 1. **Checkbox pada Clip Card**
```
┌─────────────────────────────┐
│ ☑️ <- Checkbox di sini      │ <- Clip Thumbnail
│                             │
│   [Video Preview]           │
│                             │
│   ▶️ Play Button             │
└─────────────────────────────┘
│ 📝 Title                    │
│ ⏱️ 45s  📦 4.2 MB           │
│ 📤  🗑️  ✏️  ⬇️ Download     │
└─────────────────────────────┘
```

**States:**
- **Unchecked**: Border normal (putih tipis)
- **Checked**: Border cyan menyala + shadow

---

### 2. **Bulk Action Bar** (Muncul di bawah saat ada pilihan)
```
┌─────────────────────────────────────────────────────────────────┐
│  3 clips dipilih  |  📤 Upload ke YouTube  ✅ Pilih Semua  ✖️ Batal │
└─────────────────────────────────────────────────────────────────┘
         ▲                 ▲              ▲           ▲
    Selection Count    Upload Btn    Select All   Deselect
```

**Position:** Fixed di bottom center dengan animasi slide-up
**Visibility:** Auto show/hide based on selection

---

### 3. **Upload Progress Modal**
```
┌─────────────────────────────────────────────────┐
│  📤 Upload Progress                         ✖️  │ <- Header
├─────────────────────────────────────────────────┤
│                                                 │
│  Summary:                                       │
│  ⏳ Queued: 2  📤 Uploading: 2  ✅ Done: 1  ❌ Failed: 0 │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ⏳  Funny Cat Moment                      │ │ <- Queued Item
│  │     Menunggu...                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 📤  Epic Gaming Fail                      │ │ <- Uploading Item
│  │     Uploading... 67%                      │ │
│  │     ████████████░░░░░░░                   │ │ <- Progress Bar
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ✅  Best Goals Compilation                │ │ <- Completed Item
│  │     Upload berhasil!                      │ │
│  │     ████████████████████                  │ │
│  │     [🔗 Buka Video]                       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ ❌  Failed Upload                         │ │ <- Failed Item
│  │     Upload gagal                          │ │
│  │     ⚠️ Quota exceeded. Try again tomorrow. │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Position:** Fixed right center (floating)
**Size:** 400px width, max 80vh height
**Scroll:** Auto scroll jika banyak items

---

## 🎯 User Flow Diagram

```
START
  │
  ▼
Open Gallery Page
  │
  ▼
[Multiple Clips Displayed]
  │
  ├─ Single Upload Path ─────────────┐
  │   - Click 📤 button              │
  │   - Confirm                       │
  │   - Upload 1 video                │
  │   - Show ⏳ on button            │
  │   - Wait 1-2 min                  │
  │   - Show ✅ badge                │
  │                                   │
  └─ Bulk Upload Path (NEW!) ────────┤
      1. Click checkboxes             │
         ☑️ Video 1                   │
         ☑️ Video 2                   │
         ☑️ Video 3                   │
      2. Bulk Action Bar appears      │
         [3 clips dipilih]            │
      3. Click "Upload ke YouTube"    │
      4. Confirm dialog               │
      5. Progress Modal opens         │
         - Video 1: Uploading...      │
         - Video 2: Uploading...      │
         - Video 3: Queued            │
      6. Wait & Monitor:              │
         Video 1: ████░░ 80%          │
         Video 2: ██░░░░ 40%          │
         Video 3: Queued...           │
      7. Completion:                  │
         Video 1: ✅ Done             │
         Video 2: ✅ Done             │
         Video 3: ✅ Done             │
      8. Close modal or keep open     │
      9. Gallery refreshed with       │
         ✅ Uploaded badges           │
  │                                   │
  ▼                                   ▼
END (All videos uploaded!)
```

---

## 🔄 State Transitions

### Clip Card States:
```
UNSELECTED ─────┬──> SELECTED ────┬──> UPLOADING ──> UPLOADED
    ▲           │        ▲        │
    │           │        │        │
    └───────────┘        └────────┘
   (click checkbox)   (deselect)
```

### Upload Progress States:
```
NOT_STARTED ──> QUEUED ──> UPLOADING ──> COMPLETED
                   │            │
                   │            └──> FAILED
                   │
                   └──> CANCELLED (future)
```

---

## 🎨 Color Scheme

### Clip Selection:
- **Normal Border**: `rgba(0, 255, 255, 0.1)` (cyan transparent)
- **Selected Border**: `var(--primary)` (cyan solid)
- **Selected Shadow**: `0 0 0 2px rgba(0, 255, 255, 0.3)`

### Progress Bar:
- **Background**: `rgba(255, 255, 255, 0.1)` (light gray)
- **Fill**: `linear-gradient(90deg, cyan, #00ffaa)` (cyan to green)
- **Shimmer Effect**: Animated white highlight

### Status Colors:
- **Queued**: Gray (`var(--muted)`)
- **Uploading**: Cyan (`var(--primary)`)
- **Completed**: Green (`#0f0`)
- **Failed**: Red (`#ff6464`)

---

## 📐 Layout Specs

### Bulk Action Bar:
- **Height**: Auto (padding: 1rem 1.5rem)
- **Position**: Fixed bottom 2rem from bottom
- **Alignment**: Horizontally centered
- **Gap between buttons**: 1rem
- **Border**: 1px solid cyan with glow effect
- **Border Radius**: 16px
- **Backdrop Filter**: Blur(10px)

### Progress Modal:
- **Width**: 400px
- **Max Height**: 80vh
- **Position**: Fixed right 2rem, vertically centered
- **Border**: 1px solid cyan (0.3 opacity)
- **Border Radius**: 16px
- **Shadow**: `0 20px 60px rgba(0, 0, 0, 0.7)`
- **Backdrop**: Dark transparent with blur

### Progress Item:
- **Padding**: 1rem
- **Margin Bottom**: 0.75rem
- **Border Radius**: 12px
- **Background**: `rgba(255, 255, 255, 0.03)`
- **Border**: 1px based on status color

---

## ⚡ Animations

### Bulk Action Bar:
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
```
**Duration**: 0.3s ease

### Progress Modal:
```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}
```
**Duration**: 0.3s ease

### Progress Bar Fill:
```css
.progress-bar-fill::after {
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```
**Duration**: 1.5s infinite

---

## 🖱️ Interaction States

### Checkbox:
- **Hover**: Scale(1.1)
- **Active**: Scale(0.95)
- **Checked**: Background cyan

### Bulk Upload Button:
- **Normal**: Background gradient
- **Hover**: Brighten + translateY(-2px)
- **Active**: Scale(0.98)
- **Disabled**: Opacity 0.5 + cursor not-allowed

### Progress Item:
- **Uploading**: Border glow animation
- **Completed**: Fade to green gradient
- **Failed**: Shake animation (optional)

---

## 📱 Responsive Behavior

### Mobile (<640px):
- Bulk Action Bar:
  - Stack buttons vertically
  - Full width with margin
  - Smaller padding

- Progress Modal:
  - Width: calc(100vw - 2rem)
  - Position: Bottom instead of right
  - Max height: 50vh

- Checkboxes:
  - Larger hit area (32px)
  - More spacing from edge

---

## 🎬 Example Scenarios

### Scenario 1: Select & Upload 3 Videos
1. **Gallery loaded** → 10 clips visible
2. **Click checkbox** on Clip 1, 2, 3
3. **Bulk bar appears** → "3 clips dipilih"
4. **Click "Upload ke YouTube"**
5. **Confirm dialog** → OK
6. **Progress modal opens**:
   - Clip 1: Uploading... 0%
   - Clip 2: Uploading... 0%
   - Clip 3: Queued...
7. **Progress updates every 1s**:
   - Clip 1: 25% → 50% → 75% → 90% → 100% ✅
   - Clip 2: 20% → 45% → 70% → 90% → 100% ✅
   - Clip 3: Uploading... → 30% → 60% → 90% → 100% ✅
8. **All done!**
9. **Gallery refreshed** → Green badges appear

### Scenario 2: One Failed Upload
1. Select 2 clips
2. Upload initiated
3. Clip 1: ✅ Success
4. Clip 2: ❌ Failed (quota exceeded)
5. Modal shows:
   - Clip 1: ✅ + YouTube link
   - Clip 2: ❌ + Error message
6. User can click link for Clip 1
7. Retry Clip 2 later

---

## 🔍 Key Features Summary

### ✅ Implemented:
- [x] Checkbox selection on each clip
- [x] Selected state visual feedback
- [x] Bulk action bar with count
- [x] Select all / Deselect all buttons
- [x] Upload queue manager (max 2 concurrent)
- [x] Progress modal with real-time updates
- [x] Progress bar with shimmer animation
- [x] Status icons and colors
- [x] Error handling and display
- [x] YouTube link after success
- [x] Triple protection against double upload
- [x] Estimated progress based on file size
- [x] Auto-hide bulk bar when no selection

### 🚀 Future Enhancements:
- [ ] Pause/Resume queue
- [ ] Cancel individual upload
- [ ] Retry failed from modal
- [ ] Drag-drop queue reorder
- [ ] Save upload history
- [ ] Export progress report
- [ ] Notification sound on completion
- [ ] TikTok bulk upload

---

## 🎉 Happy Uploading!

**Bulk upload feature is now live and ready to use!** 📤✨
