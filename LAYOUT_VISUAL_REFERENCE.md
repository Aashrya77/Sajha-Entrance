# College Details Page - Visual Layout & Structure

## 📐 Page Layout Structure

```
┌────────────────────────────────────────────────────────────────────┐
│                          NAVIGATION BAR                             │
│                     (Logo, Menu, Search, etc.)                      │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    COLLEGE COVER IMAGE BACKGROUND                   │
│                                                                      │
│                           [COLLEGE LOGO]  College Name              │
│                           ✓ Verified Badge                          │
│                                                                      │
│                    📍 Address │ 🏛️ University │ 📅 Year              │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────── 3-COLUMN CONTENT AREA ─────────────────────────┐
│                                                                      │
│  ┌──────────┐  ┌────────────────────────────┐  ┌──────────────────┐
│  │   LEFT   │  │                            │  │     RIGHT        │
│  │ SIDEBAR  │  │      MAIN CONTENT          │  │     SIDEBAR      │
│  │  (2 col) │  │        (7 col)             │  │     (3 col)      │
│  │          │  │                            │  │                  │
│  │ 📋 About │  │  📢 ADMISSION NOTICE BAR   │  │ CONTACT INFO     │
│  │          │  │  ┌──────────────────────┐  │  │ ┌──────────────┐ │
│  │ 🎓 Admin │  │  │ Admission open text  │  │  │ │ 🏢 University│ │
│  │          │  │  │ 🎓 Closes: Date      │  │  │ │ 📍 Address   │ │
│  │ 📚 Prog  │  │  │ [Apply Now Button]   │  │  │ │ 📞 Phone     │ │
│  │ (5) 🔶  │  │  └──────────────────────┘  │  │ │ ✉️ Email     │ │
│  │          │  │                            │  │ │ 🌐 Website   │ │
│  │ ⭐ Feat  │  │  📖 ABOUT SECTION         │  │ └──────────────┘ │
│  │          │  │  ┌──────────────────────┐  │  │                  │
│  │ 📄 Guide │  │  │ College overview...  │  │  │ 📍 LOCATION      │
│  │          │  │  │ Rich HTML content    │  │  │ ┌──────────────┐ │
│  │ 💰 Schol │  │  └──────────────────────┘  │  │ │   Google     │ │
│  │          │  │                            │  │ │   Maps       │ │
│  │ 🖼️ Gall  │  │  📚 OFFERED PROGRAMS     │  │ │   Iframe     │ │
│  │          │  │  ┌──────┐ ┌──────┐       │  │ │   (350px)    │ │
│  │ 👔 Chair │  │  │ Card │ │ Card │       │  │ └──────────────┘ │
│  │          │  │  │ BS   │ │ BIM  │       │  │                  │
│  │ 📍 Loc   │  │  │      │ │      │       │  │  (Sticky on      │
│  │          │  │  └──────┘ └──────┘       │  │   desktop)       │
│  │ 🎥 Video │  │  ┌──────┐ ┌──────┐       │  │                  │
│  │          │  │  │ Card │ │ Card │       │  │                  │
│  │          │  │  │ MSc  │ │ PhD  │       │  │                  │
│  │(Sticky)  │  │  └──────┘ └──────┘       │  │                  │
│  │          │  │                            │  │                  │
│  │(Active:  │  │  ⭐ SALIENT FEATURES      │  │                  │
│  │ Orange   │  │  ┌──────────────────────┐  │  │                  │
│  │ Highlight│  │  │ ✓ Feature 1          │  │  │                  │
│  │ + Left   │  │  │ ✓ Feature 2          │  │  │                  │
│  │ Border)  │  │  │ ✓ Feature 3          │  │  │                  │
│  │          │  │  └──────────────────────┘  │  │                  │
│  │          │  │                            │  │                  │
│  │          │  │  📄 ADMISSION GUIDELINES   │  │                  │
│  │          │  │  ┌──────────────────────┐  │  │                  │
│  │          │  │  │ Rich text content... │  │  │                  │
│  │          │  │  └──────────────────────┘  │  │                  │
│  │          │  │                            │  │                  │
│  │          │  │  💰 SCHOLARSHIP INFO      │  │                  │
│  │          │  │  ┌──────────────────────┐  │  │                  │
│  │          │  │  │ Rich text content... │  │  │                  │
│  │          │  │  └──────────────────────┘  │  │                  │
│  │          │  │                            │  │                  │
│  │          │  │  🖼️ GALLERY                │  │                  │
│  │          │  │  ┌────┐ ┌────┐ ┌────┐    │  │                  │
│  │          │  │  │Img │ │Img │ │Img │    │  │                  │
│  │          │  │  └────┘ └────┘ └────┘    │  │                  │
│  │          │  │  ┌────┐ ┌────┐ ┌────┐    │  │                  │
│  │          │  │  │Img │ │Img │ │Img │    │  │                  │
│  │          │  │  └────┘ └────┘ └────┘    │  │                  │
│  │          │  │                            │  │                  │
│  │          │  │  👔 CHAIRMAN MESSAGE      │  │                  │
│  │          │  │  ┌──────────────────────┐  │  │                  │
│  │          │  │  │ "Dear Students..."   │  │  │                  │
│  │          │  │  │                      │  │  │                  │
│  │          │  │  │ — Dr. Name           │  │  │                  │
│  │          │  │  └──────────────────────┘  │  │                  │
│  │          │  │                            │  │                  │
│  │          │  │  🎥 VIDEOS                │  │                  │
│  │          │  │  ┌──────┐ ┌──────┐       │  │                  │
│  │          │  │  │Video │ │Video │       │  │                  │
│  │          │  │  │Embed │ │Embed │       │  │                  │
│  │          │  │  └──────┘ └──────┘       │  │                  │
│  │          │  │                            │  │                  │
│  └──────────┘  └────────────────────────────┘  └──────────────────┘
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                           FOOTER                                    │
│                    (Copyright, Links, etc.)                         │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile Layout (< 768px)

```
┌──────────────────────────────────┐
│     NAVIGATION BAR               │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│   COLLEGE COVER + LOGO + INFO   │
│                                  │
│      [LOGO] College Name         │
│      📍 Address | 🏛️ University   │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│  📢 ADMISSION NOTICE BAR         │
│  (Full width, scrolls normally)  │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│  MAIN CONTENT (Full Width)       │
│  (Left sidebar hidden)           │
│                                  │
│  📖 ABOUT SECTION                │
│  ┌──────────────────────────────┐│
│  │ College overview...          ││
│  └──────────────────────────────┘│
│                                  │
│  📚 OFFERED PROGRAMS             │
│  ┌──────────────────────────────┐│
│  │         Course Card          ││
│  │         (Full width)         ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │         Course Card          ││
│  └──────────────────────────────┘│
│                                  │
│  ⭐ SALIENT FEATURES             │
│  ┌──────────────────────────────┐│
│  │ ✓ Feature 1                  ││
│  │ ✓ Feature 2                  ││
│  └──────────────────────────────┘│
│                                  │
│  ... other sections stacked ...  │
│                                  │
│  🖼️ GALLERY                       │
│  ┌────────┐                      │
│  │ Image  │                      │
│  └────────┘                      │
│  ┌────────┐                      │
│  │ Image  │                      │
│  └────────┘                      │
│                                  │
│  🎥 VIDEOS                        │
│  ┌────────────────────────────────┐│
│  │ Video Player (Responsive)      ││
│  │ Video Title                    ││
│  └────────────────────────────────┘│
│                                  │
│  CONTACT INFO (Stacked)          │
│  ┌────────────────────────────────┐│
│  │ 🏢 University                  ││
│  │ 📍 Address                     ││
│  │ 📞 Phone                       ││
│  │ ✉️ Email                       ││
│  │ 🌐 Website                     ││
│  └────────────────────────────────┘│
│                                  │
│  📍 LOCATION                      │
│  ┌────────────────────────────────┐│
│  │   Google Maps (300px height)   ││
│  └────────────────────────────────┘│
└──────────────────────────────────┘

┌──────────────────────────────────┐
│           FOOTER                 │
└──────────────────────────────────┘
```

---

## 🎯 Component Grid Layouts

### Offered Programs Grid
```
Desktop (≥992px):  4 columns (280px each)
Tablet (768-991px): 2 columns
Mobile (<768px):   1 column (full width)
```

### Gallery Grid
```
Desktop (≥992px):  4 columns (200px each)
Tablet (768-991px): 3 columns
Mobile (<768px):   2 columns (150px each)
```

### Videos Grid
```
Desktop (≥992px):  2 columns (280px each)
Tablet (768-991px): 1 column (full width)
Mobile (<768px):   1 column (full width)
```

---

## 🎨 Color Palette

```
Primary Orange:  #ff9800
Light Orange:    #fff3e0
Dark Gray:       #1a1a1a
Medium Gray:     #333
Light Gray:      #555
Border Gray:     #e9ecef
Background:      #f8f9fa
White:           #fff

Active State:    Orange background with orange left border
Hover State:     Orange text + left border on nav
Hover Elevation: translateY(-4px) + enhanced shadow
```

---

## 🏷️ Element Spacing

```
Section Margin-Bottom:     40px
Main Content Padding:      30px (desktop), 20px (tablet), 16px (mobile)
Card Gap:                  20px
Navigation Item Padding:   12px 16px
Details Row Gap:           20px
Contact Item Margin-Bottom: 24px
Sidebar Top Offset:        80px (sticky positioning)
Content Wrapper Margin-Top: 60px (breathing space below navbar)
```

---

## 📊 Column Ratios (Desktop)

```
┌─────────────────────────────────────────────────┐
│                  12-column grid                 │
├───────────┬─────────────────────────┬───────────┤
│  2 cols   │      7 cols             │  3 cols   │
│ (16.67%)  │     (58.33%)            │ (25%)     │
│           │                         │           │
│   LEFT    │    MAIN CONTENT         │  RIGHT    │
│ SIDEBAR   │                         │ SIDEBAR   │
│           │                         │           │
└───────────┴─────────────────────────┴───────────┘
```

---

## ⚡ Interactive Elements

### Navigation Links
```
Default State:      Gray text (#333), no left border
Hover State:        Orange text (#ff9800), orange left border
Active State:       Orange background (#fff3e0), 
                    orange left border, orange text
Transition:         0.3s ease
```

### Course Cards
```
Default State:      White bg, light shadow, no elevation
Hover State:        Orange border, elevated 4px up,
                    enhanced shadow with orange tint
Transition:         0.3s ease
```

### Gallery Images
```
Default State:      Normal size, light shadow
Hover State:        Scaled slightly, elevated 4px up,
                    enhanced shadow
Transition:         0.3s ease
```

### Buttons (Apply Now)
```
Default State:      Orange bg (#ff9800), white text
Hover State:        Darker orange (#f57c00), elevated 2px,
                    shadow effect
Transition:         0.3s ease
```

---

## 📏 Breakpoint Behavior

### Desktop (≥992px)
- 3-column layout
- Sticky sidebars (top: 80px)
- Left sidebar visible
- Full hover effects
- Cards show with elevations

### Tablet (768px - 991px)
- Content-only layout
- Sidebars stack below content
- No sticky positioning (relative)
- Full content visibility
- Adjusted spacing

### Mobile (<768px)
- Single column layout
- Left sidebar hidden (d-none d-md-block)
- Right sidebar stacks with content
- Optimized tap targets
- Responsive images
- Simplified grids
- Reduced padding/margins

---

## 🔄 Dynamic Content Rendering

```javascript
IF admissionNotice exists:
  SHOW: Admission Notice Bar (gold background, icon, button)
ELSE:
  HIDE: Section

IF overview exists:
  SHOW: About Section
ELSE:
  HIDE: Section

IF courses exist:
  SHOW: Offered Programs (with badge showing count)
  Grid: Responsive card layout
ELSE:
  HIDE: Section

IF keyFeatures exist:
  SHOW: Salient Features (bulleted list)
ELSE:
  HIDE: Section

IF admissionGuidelines exists:
  SHOW: Admission Guidelines Section
ELSE:
  HIDE: Section

IF scholarshipInfo exists:
  SHOW: Scholarship Info Section
ELSE:
  HIDE: Section

IF galleryImages exist:
  SHOW: Gallery Section (responsive grid)
ELSE:
  HIDE: Section

IF messageFromChairman exists:
  SHOW: Chairman Message (with signature)
ELSE:
  HIDE: Section

IF videos exist:
  SHOW: Videos Section (embed grid)
ELSE:
  HIDE: Section

IF googleMapUrl exists:
  SHOW: Location Section (Google Maps iframe)
ELSE:
  HIDE: Section

Always Show:
  - Navigation sidebar (desktop only)
  - Main content wrapper
  - Contact info sidebar
```

---

## 📐 Box Models

### Card Component
```
┌─────────────────────────┐
│      Padding: 20px      │  ← Inner spacing
├─────────────────────────┤
│    Content goes here    │
├─────────────────────────┤
│      Border: 1px        │  ← Subtle divider
│      Shadow: 0 2px 8px  │  ← Subtle shadow
├─────────────────────────┤
│    Margin: 20px gap     │  ← Space between cards
└─────────────────────────┘
```

### Section Component
```
┌──────────────────────────┐
│   Margin-Bottom: 40px    │
├──────────────────────────┤
│ ▪ Section Title          │
│   (with orange underline)│
├──────────────────────────┤
│                          │
│  Section Content         │
│  (Dynamic based on type) │
│                          │
├──────────────────────────┤
└──────────────────────────┘
```

---

## 🎬 Animation & Transitions

```
Navigation Links:     0.3s ease (color + border)
Card Hover:          0.3s ease (elevation + shadow + border)
Gallery Items:       0.3s ease (shadow + transform)
Buttons:             0.3s ease (all properties)
Smooth Scroll:       behavior: 'smooth' (browser default)
```

---

## ♿ Accessibility Features

```
✅ Semantic HTML structure
✅ ARIA labels on interactive elements
✅ Sufficient color contrast (WCAG AA)
✅ Keyboard navigation support
✅ Focus indicators
✅ Image alt text
✅ Form labels
✅ Skip links support
✅ Lazy loading for performance
✅ Mobile-friendly touch targets
```

