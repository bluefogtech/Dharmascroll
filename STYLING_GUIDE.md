# Styling Guide: Manual Adjustment of Text Sizes and Elements

This guide provides all the details you need to manually adjust text sizes, spacing, colors, and other visual elements on the DharmaScroll web page.

---

## 📍 File Locations

- **Main CSS**: `index.html` (lines 19-850, inside `<style>` tag)
- **Component Styles**: `components/QuoteCard.tsx` (inline styles)
- **App Layout**: `App.tsx` (inline styles for layout)

---

## 🎨 Color Variables (CSS Custom Properties)

All colors are defined in `:root` (lines 20-40 in `index.html`):

```css
--bg-dark: #1a0f0a;                    /* Main background */
--bg-secondary: #2d1a14;              /* Secondary background */
--accent-saffron: #FF6B35;            /* Saffron accent */
--accent-gold: #FFD700;                /* Gold accent */
--accent-kumkum: #FF1744;              /* Red accent */
--accent-turmeric: #FFB84D;           /* Turmeric accent */
--text-gold-brilliant: #FFC107;       /* Gold text */
--text-cream: #FFF8E1;                 /* Cream text */
--text-white: #FFFFFF;                 /* White text */
```

**To change colors**: Edit the values in `index.html` lines 22-39.

---

## 📏 Responsive Breakpoints

- **Mobile**: `@media (max-width: 768px)`
- **Desktop**: `@media (min-width: 769px)`
- **Large Desktop**: `@media (min-width: 1024px)`
- **Small Mobile**: `@media (max-width: 480px)`
- **Medium Desktop**: `@media (max-width: 1200px)`

For a full assessment of responsive design across screen sizes and device types (phones, tablets, desktops, notched devices), see **RESPONSIVE_DESIGN.md**.

---

## 📝 Text Elements & Font Sizes

### 1. **Reference/Chapter (`.quote-source`)**

**Location**: `index.html` lines 252-258

**Desktop**:
- `font-size: 0.9rem` (14.4px)
- `font-weight: 800`
- `color: var(--accent-saffron)`
- `margin-bottom: 0.5rem`

**Mobile**:
- Same as desktop (no override)

**To adjust**: Edit `.quote-source` in `index.html` line 252.

---

### 2. **Context (`.quote-context`)**

**Location**: `index.html` lines 259-267

**Desktop**:
- `font-size: 0.75rem` (12px)
- `color: var(--accent-turmeric)`
- `margin-bottom: 0.8rem`

**Mobile**:
- Same as desktop

**To adjust**: Edit `.quote-context` in `index.html` line 259.

---

### 3. **Sanskrit Text (`.quote-sanskrit`)**

**Location**: `index.html` lines 206-215

**Desktop**:
- `font-size: 1.1rem` (17.6px)
- `color: var(--text-gold-brilliant)`
- `line-height: 1.6`
- `margin-bottom: 1.25rem`
- `font-weight: 500`

**Mobile** (`@media (max-width: 768px)`):
- `font-size: 0.95rem !important` (15.2px)
- `margin-bottom: 0.75rem !important`

**Inline override** (QuoteCard.tsx line 279):
- `fontSize: '0.95rem'` (applied to all screens)

**To adjust**:
- Desktop: Edit `.quote-sanskrit` in `index.html` line 206
- Mobile: Edit `.quote-sanskrit` in `index.html` line 220
- Inline: Edit `fontSize` in `components/QuoteCard.tsx` line 279

---

### 4. **English/Hindi Translation (`.quote-main`)**

**Location**: `index.html` lines 225-232

**Desktop**:
- `font-size: clamp(1.1rem, 4vw, 2.4rem)` (responsive: 17.6px - 38.4px)
- `font-weight: 500`
- `line-height: 1.4`
- `margin-bottom: 1.5rem`
- `color: var(--text-cream)`

**Desktop Large** (`@media (min-width: 768px)`):
- `font-size: 2.2rem` (35.2px)

**Desktop XL** (`@media (min-width: 1024px)`):
- `font-size: 2.4rem` (38.4px)

**Mobile** (`@media (max-width: 768px)`):
- `line-height: 1.35 !important`
- `max-height: calc(100vh - 280px)`

**Small Mobile** (`@media (max-width: 480px)`):
- `font-size: clamp(1rem, 5vw, 1.5rem)` (16px - 24px)
- `line-height: 1.35 !important`

**Dynamic sizing** (QuoteCard.tsx line 290):
- Uses `dynamicFontSize` state (calculated based on text length)
- Fallback: `'1.85rem'` (English/Hindi) or `'1.6rem'` (Tamil)

**To adjust**:
- Desktop base: Edit `.quote-main` in `index.html` line 225
- Desktop large: Edit `.quote-main` in `index.html` line 564
- Desktop XL: Edit `.quote-main` in `index.html` line 579
- Mobile: Edit `.quote-main` in `index.html` line 336
- Small mobile: Edit `.quote-main` in `index.html` line 595
- Dynamic fallback: Edit `fontSize` in `components/QuoteCard.tsx` line 290

---

### 5. **Tags (`.tag`)**

**Location**: `index.html` lines 281-286

**All screens**:
- `font-size: 0.55rem` (8.8px)
- `padding: 0.2rem 0.6rem`
- `color: var(--text-gold-brilliant)`
- `font-weight: 800` (via text-transform: uppercase)

**To adjust**: Edit `.tag` in `index.html` line 281.

---

### 6. **Action Buttons (Like/Share) (`.action-btn`)**

**Location**: `index.html` lines 408-426

**Desktop**:
- Button size: `width: 3rem; height: 3rem` (48px × 48px)
- Icon size: `width: 1.4rem; height: 1.4rem` (22.4px)
- `color: var(--accent-saffron)`

**Mobile** (`@media (max-width: 768px)`):
- Button size: `width: 2.75rem; height: 2.75rem` (44px × 44px)
- Icon size: `width: 1.3rem !important; height: 1.3rem !important` (20.8px)

**To adjust**:
- Desktop: Edit `.action-btn` in `index.html` line 408
- Mobile: Edit `.action-btn` in `index.html` line 407

---

### 7. **Scroll Cue (Down Arrow) (`.scroll-cue`)**

**Location**: `index.html` lines 482-488

**All screens**:
- Icon size: `width: 2rem; height: 2rem` (32px)
- `opacity: 0.7`
- `color: var(--accent-gold)`

**To adjust**: Edit `.scroll-cue` in `index.html` line 482.

---

### 8. **Header Logo (`.header-logo`)**

**Location**: `index.html` lines 493-499

**All screens**:
- Logo text: `font-size: 0.75rem` (12px) - set inline in App.tsx
- ॐ symbol: `font-size: 1.4rem` (22.4px) - set inline in App.tsx

**To adjust**: Edit inline styles in `App.tsx` lines 760-780.

---

### 9. **Language Picker (`.lang-option`)**

**Location**: `index.html` lines 456-470

**Desktop**:
- `font-size: 0.65rem` (10.4px)
- `padding: 0.4rem 0.8rem`
- `font-weight: 800`

**Mobile**: Same as desktop

**To adjust**: Edit `.lang-option` in `index.html` line 456.

---

### 10. **Version Tag (`.version-tag`)**

**Location**: `index.html` lines 500-504

**Desktop**:
- `font-size: 8px`
- `font-family: monospace`
- `font-weight: 500`

**Mobile** (`@media (max-width: 768px)`):
- `font-size: 0.7rem !important` (11.2px)

**To adjust**:
- Desktop: Edit `.version-tag` in `index.html` line 500
- Mobile: Edit `.version-tag` in `index.html` line 386

---

## 📐 Spacing & Layout

### **Quote Content Area (`.quote-content-area`)**

**Location**: `index.html` lines 93-110

**Desktop**:
- `padding: 2rem` (32px)
- `padding-top: calc(2rem + 60px)` (92px)
- `padding-bottom: calc(2rem + 120px)` (152px)
- `padding-left: 1.5rem` (24px)
- `padding-right: 1.5rem` (24px)

**Desktop Large** (`@media (min-width: 768px)`):
- `padding: 3rem 4rem` (48px vertical, 64px horizontal)

**Mobile** (`@media (max-width: 768px)`):
- `padding: 1rem 1rem !important` (16px)
- `padding-top: calc(1rem + 60px) !important` (76px)
- `padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 11rem) !important`
- `padding-right: calc(1rem + 4rem) !important` (80px)
- `padding-left: 1rem !important` (16px)

**Small Mobile** (`@media (max-width: 480px)`):
- `padding: 1.5rem 1rem` (24px vertical, 16px horizontal)
- `padding-top: calc(1.5rem + 60px)` (84px)
- `padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 11rem) !important`
- `padding-right: calc(1rem + 4rem) !important`

**Gita Mobile** (`@media (max-width: 768px)` + `.gita-verse-area`):
- `padding: 2rem 1.25rem calc(env(safe-area-inset-bottom, 0px) + 12rem) 1.25rem !important`
- `padding-top: calc(1rem + 100px) !important` (116px)

**To adjust**: Edit `.quote-content-area` in `index.html` line 93 and respective media queries.

---

### **Reference Block (`.quote-reference-top`)**

**Location**: `index.html` lines 243-249

**All screens**:
- `margin-top: 0` (set in CSS)
- `margin-bottom: 0.75rem` (set inline in QuoteCard.tsx line 260)

**Spacing between elements**:
- `.quote-reference-top .quote-source`: `margin-bottom: 0.25rem`
- `.quote-reference-top .tag-container`: `margin-top: 0.5rem`

**To adjust**:
- CSS: Edit `.quote-reference-top` in `index.html` line 243
- Inline: Edit `marginBottom` in `components/QuoteCard.tsx` line 260

---

### **Sanskrit Block (`.quote-sanskrit-wrap`)**

**Location**: `index.html` lines 366-368

**Mobile** (`@media (max-width: 768px)`):
- `margin-bottom: 1rem !important`
- `padding-bottom: 0.25rem`

**Inline** (QuoteCard.tsx line 278):
- `marginBottom: '1rem'`

**To adjust**:
- Mobile: Edit `.quote-sanskrit-wrap` in `index.html` line 366
- Inline: Edit `marginBottom` in `components/QuoteCard.tsx` line 278

---

### **Translation Block (`.quote-translation-block`)**

**Location**: `index.html` lines 371-374 (mobile), 116 (desktop)

**Desktop** (`@media (min-width: 769px)`):
- `max-height: 70%` (limits space to 70% of container)

**Mobile** (`@media (max-width: 768px)`):
- `position: relative`
- `z-index: 0`

**Inline** (QuoteCard.tsx line 285):
- `flex: '1 1 auto'`
- `minHeight: 0`

**To adjust**:
- Desktop max-height: Edit `.quote-translation-block` in `index.html` line 116
- Mobile: Edit `.quote-translation-block` in `index.html` line 371
- Inline: Edit `flex` and `minHeight` in `components/QuoteCard.tsx` line 285

---

### **Action Bar (`.action-bar`)**

**Location**: `index.html` lines 290-306

**Desktop**:
- `position: absolute`
- `right: 15%`
- `bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem)`
- `gap: 1.5rem` (between buttons)

**Desktop Medium** (`@media (max-width: 1200px)`):
- `right: 2rem`

**Desktop In-Flow** (`@media (min-width: 769px)` + `.quote-actions-below .action-bar`):
- `position: static`
- `right: auto`
- `bottom: auto`
- `flex-direction: row` (buttons side by side)

**Mobile** (`@media (max-width: 768px)`):
- `bottom: calc(env(safe-area-inset-bottom, 0px) + 8.5rem)`
- `right: 0.75rem`
- `gap: 1rem`

**To adjust**:
- Desktop absolute: Edit `.action-bar` in `index.html` line 290
- Desktop in-flow: Edit `.quote-actions-below .action-bar` in `index.html` line 120
- Mobile: Edit `.action-bar` in `index.html` line 331

---

### **Scroll Cue (`.scroll-cue`)**

**Location**: `index.html` lines 482-488

**Desktop Absolute**:
- `position: absolute`
- `bottom: calc(env(safe-area-inset-bottom, 0px) + 1.2rem)`
- `left: 50%`
- `transform: translateX(-50%)`

**Desktop In-Flow** (`@media (min-width: 769px)` + `.quote-actions-below .scroll-cue`):
- `position: static`
- `left: auto`
- `bottom: auto`
- `transform: none`

**Mobile**: Same as desktop absolute

**To adjust**:
- Desktop absolute: Edit `.scroll-cue` in `index.html` line 482
- Desktop in-flow: Edit `.quote-actions-below .scroll-cue` in `index.html` line 125

---

### **Actions Below Wrapper (`.quote-actions-below`)**

**Location**: `index.html` lines 117-127 (desktop), 328-336 (mobile)

**Desktop** (`@media (min-width: 769px)`):
- `display: flex`
- `flex-direction: column`
- `align-items: center`
- `gap: 1rem`
- `margin-top: 1.5rem`
- `flex-shrink: 0`

**Mobile** (`@media (max-width: 768px)`):
- `position: absolute`
- `bottom: 0`
- `left: 0`
- `right: 0`
- `height: 0`
- `pointer-events: none`

**To adjust**:
- Desktop: Edit `.quote-actions-below` in `index.html` line 117
- Mobile: Edit `.quote-actions-below` in `index.html` line 328

---

## 🎯 Line Heights

- **Sanskrit**: `line-height: 1.6` (desktop), `1.35` (mobile)
- **Translation**: `line-height: 1.4` (desktop), `1.35` (mobile)
- **Source**: `line-height: 1.4`
- **Context**: `line-height: 1.4`

**To adjust**: Edit respective `.quote-sanskrit`, `.quote-main`, `.quote-source`, `.quote-context` in `index.html`.

---

## 📱 Container Sizes

### **Quote Content Inner Container (`.quote-content-area > div`)**

**Desktop**:
- `max-width: 36rem` (576px)

**Desktop Large** (`@media (min-width: 768px)`):
- `max-width: 42rem` (672px)

**Desktop XL** (`@media (min-width: 1024px)`):
- `max-width: 48rem` (768px)

**Mobile**:
- `max-width: 100% !important`
- `max-height: calc(100vh - 280px) !important`

**To adjust**: Edit `.quote-content-area > div` in `index.html` line 118 and media queries.

---

## 🔧 Dynamic Font Sizing (JavaScript)

**Location**: `components/QuoteCard.tsx` lines 47-150

The English/Hindi translation uses dynamic font sizing based on:
- Text length
- Viewport dimensions
- Reserved space for header, Sanskrit, metadata, footer

**Key variables**:
- `headerSpace`: 90px (mobile) / 100px (desktop)
- `sanskritSpace`: 35px (mobile) / 40px (desktop) if Sanskrit present
- `metadataSpace`: 200px (mobile) / 100px (desktop)
- `footerSpace`: 50px (mobile) / 60px (desktop)

**Base sizes**:
- English/Hindi: `1.8rem` (mobile) / `1.85rem` (desktop)
- Tamil: `1.5rem` (mobile) / `1.6rem` (desktop)

**Scaling factors** (based on text length):
- > 400 chars: `0.60`
- > 300 chars: `0.68`
- > 200 chars: `0.75`
- > 150 chars: `0.82`
- > 100 chars: `0.90`
- > 50 chars: `0.96`

**To adjust**: Edit the `adjustFontSize` function in `components/QuoteCard.tsx` lines 47-150.

---

## 🎨 Additional Styling Notes

### **Separator Line**

**Location**: `components/QuoteCard.tsx` lines 299-307

- `height: 2px`
- `width: 2.5rem` (40px)
- `margin: 1rem auto 0`

**To adjust**: Edit inline styles in `components/QuoteCard.tsx` line 299.

---

### **Tag Container (`.tag-container`)**

**Location**: `index.html` lines 277-279

- `gap: 0.4rem`
- `margin-top: 0.5rem`

**To adjust**: Edit `.tag-container` in `index.html` line 277.

---

### **Z-Index Hierarchy**

- `z-index: 0` - Background blobs
- `z-index: 10` - Quote content area
- `z-index: 15` - Meta overlay
- `z-index: 20` - Action bar (mobile)
- `z-index: 30` - Chapters button (mobile Gita)
- `z-index: 50` - Version tag
- `z-index: 55` - Main content wrapper
- `z-index: 60` - Action bar (desktop)
- `z-index: 70` - Action bar, scroll cue
- `z-index: 100` - Header logo
- `z-index: 1000+` - Modals, overlays

**To adjust**: Edit respective `z-index` values in `index.html` and `App.tsx`.

---

## 📋 Quick Reference: Common Adjustments

### **Make Sanskrit Text Larger**
1. Desktop: `index.html` line 206 → change `font-size: 1.1rem` to desired size
2. Mobile: `index.html` line 220 → change `font-size: 0.95rem`
3. Inline: `components/QuoteCard.tsx` line 279 → change `fontSize: '0.95rem'`

### **Make Translation Text Larger**
1. Desktop base: `index.html` line 225 → change `clamp(1.1rem, 4vw, 2.4rem)`
2. Desktop large: `index.html` line 564 → change `font-size: 2.2rem`
3. Fallback: `components/QuoteCard.tsx` line 290 → change `'1.85rem'`

### **Increase Spacing Between Elements**
1. Reference to Sanskrit: `components/QuoteCard.tsx` line 260 → increase `marginBottom: '0.75rem'`
2. Sanskrit to Translation: `components/QuoteCard.tsx` line 278 → increase `marginBottom: '1rem'`
3. Translation to Actions: `index.html` line 123 → increase `margin-top: 1.5rem`

### **Change Colors**
1. Edit CSS variables in `index.html` lines 22-39
2. Or override specific elements (e.g., `.quote-source` → `color: #yourcolor`)

### **Adjust Action Button Size**
1. Desktop: `index.html` line 408 → change `width: 3rem; height: 3rem`
2. Mobile: `index.html` line 407 → change `width: 2.75rem; height: 2.75rem`

---

## 🔍 Finding Specific Elements

Use browser DevTools:
1. Right-click element → Inspect
2. Check the class name (e.g., `.quote-main`, `.quote-sanskrit`)
3. Search for that class in `index.html` or `components/QuoteCard.tsx`
4. Modify the CSS property you want to change

---

## ⚠️ Important Notes

1. **Mobile overrides**: Many mobile styles use `!important` - you may need to add `!important` when overriding
2. **Inline styles**: Some styles are set inline in React components - check both CSS and component files
3. **Dynamic sizing**: Translation text uses JavaScript-based dynamic sizing - adjust the algorithm in `QuoteCard.tsx` if needed
4. **Responsive**: Always test changes on both mobile and desktop breakpoints
5. **Safe areas**: Mobile padding uses `env(safe-area-inset-bottom)` - account for device notches/home bars

---

## 📞 Need Help?

- Check browser DevTools for computed styles
- Use `!important` if styles aren't applying (especially on mobile)
- Test on actual devices for accurate spacing/sizing
- Remember: CSS in `index.html` takes precedence over inline styles unless inline uses `!important`
