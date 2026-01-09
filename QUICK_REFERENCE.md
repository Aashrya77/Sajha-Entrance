# Quick Reference - College Page Configuration

## 🚀 Quick Start

### To add content to a college:
1. Go to AdminJS panel → College collection
2. Select a college to edit
3. Fill in the new fields (see below)
4. Click Save
5. Visit the college details page to see changes

---

## 📋 MongoDB Fields Added

| Field | Type | Use For | AdminJS Field Type |
|-------|------|---------|-------------------|
| `admissionGuidelines` | String | Step-by-step admission process | Rich Text Editor |
| `scholarshipInfo` | String | Scholarship details & eligibility | Rich Text Editor |
| `messageFromChairman` | String | Message/greeting from leadership | Rich Text Editor |
| `chairmanName` | String | Name of message author | Text Input |
| `keyFeatures` | [String] | 5-15 key highlights | Text Array |
| `galleryImages` | [String] | Image filenames | String Array |
| `googleMapUrl` | String | Google Maps embed URL | Text Input |
| `videos` | [{title, url}] | YouTube videos | Object Array |

---

## 🎨 Navigation Tabs (Left Sidebar)

```
1. About              → college.ejs:about
2. Admissions        → college.ejs:admissions
3. Offered Programs  → college.ejs:programs (shows count badge)
4. Salient Features  → college.ejs:features
5. Admission Guidelines → college.ejs:guidelines
6. Scholarship Information → college.ejs:scholarship
7. Gallery           → college.ejs:gallery
8. Message from the Chairman → college.ejs:chairman
9. Location          → college.ejs:location
10. Videos           → college.ejs:videos
```

---

## 📝 Content Entry Guide

### Admission Guidelines
```
Enter as: Rich HTML text (use editor formatting)
Appears in: "Admission Guidelines" section
Max length: 500-800 words recommended
Include: Steps, documents needed, deadlines
```

### Scholarship Information
```
Enter as: Rich HTML text
Appears in: "Scholarship Information" section
Max length: 400-600 words
Include: Scholarship types, eligibility, benefits, deadlines
```

### Message from Chairman
```
Fields to fill:
  - messageFromChairman: Rich HTML text
  - chairmanName: Text (e.g., "Dr. John Smith")
Appears in: "Message from the Chairman" section
Max length: 200-400 words
```

### Salient Features
```
Enter as: Array of strings (comma or line separated)
Examples:
  - Modern Infrastructure
  - Experienced Faculty
  - International Curriculum
  - Industry Partnerships
Display: Bulleted list with orange checkmarks
Count: 5-15 features recommended
```

### Gallery Images
```
Steps:
1. Upload image files to /public/colleges/ folder
2. In AdminJS, enter filenames: image1.jpg, image2.jpg
3. Images display in responsive grid
Display: 4-column grid on desktop, responsive on mobile
Format: .jpg, .png, .webp supported
```

### Google Maps Location
```
Steps:
1. Open Google Maps
2. Search for college location
3. Click "Share" button
4. Select "Embed a map"
5. Copy the iframe src URL
6. Paste into googleMapUrl field (ONLY the URL, not <iframe>)
Display: Embedded map in Location section (right sidebar)
```

### Videos
```
Steps:
1. Find YouTube videos
2. Get embed URL: https://www.youtube.com/embed/VIDEO_ID
3. In AdminJS videos field, add:
   {
     "title": "Video Title",
     "url": "https://www.youtube.com/embed/VIDEOID"
   }
Display: Video grid with title below each video
```

---

## 🛠️ Field-to-Section Mapping

```
admissionGuidelines    → Admission Guidelines section (id: #guidelines)
scholarshipInfo        → Scholarship Information section (id: #scholarship)
messageFromChairman    → Message from the Chairman section (id: #chairman)
chairmanName          → Displayed as signature
keyFeatures           → Salient Features section (id: #features)
galleryImages         → Gallery section (id: #gallery)
googleMapUrl          → Location section (id: #location, right sidebar)
videos                → Videos section (id: #videos)
```

---

## ❌ Common Mistakes to Avoid

```
❌ Copying entire Google Maps <iframe> tag
✅ Copy only the src URL

❌ Using YouTube watch URL (youtube.com/watch?v=...)
✅ Use embed URL (youtube.com/embed/...)

❌ Putting full image paths in Gallery
✅ Put only filenames (image.jpg, not /colleges/image.jpg)

❌ Uploading images to wrong folder
✅ Use /public/colleges/ folder

❌ Leaving empty sections
✅ Sections hide if data is empty (uses <% if %>)

❌ Not using rich text editor for HTML content
✅ Use editor for formatted content (bold, lists, links)

❌ Mixing comma and line separators in arrays
✅ Use consistent separator (all commas OR all newlines)
```

---

## 🔍 Testing Your Changes

After adding content to AdminJS, test:

```
1. Refresh college details page
2. Verify new section appears
3. Check sidebar navigation includes it
4. Click nav link - should scroll smoothly
5. Test on mobile (responsive design)
6. Test on tablet
7. Check all links/embeds work
```

---

## 📱 Responsive Behavior

| Device | Layout | Notes |
|--------|--------|-------|
| Desktop (≥992px) | 3 columns (2:7:3) | Sticky sidebars |
| Tablet (768-991px) | Stacked | Left sidebar below content |
| Mobile (<768px) | Single column | Left sidebar hidden |

---

## 🎯 Display Locations

```
Header Bar
↓
College Cover Image + Logo + Name + Details
↓
Admission Notice Bar (if data exists)
↓
┌─────────────────────────────────────────────┐
│ Nav    │  Main Content Sections  │ Contact  │
│ Tabs   │                        │ Info +   │
│        │ • About                │ Location │
│        │ • Offered Programs      │ Map      │
│        │ • Salient Features      │          │
│        │ • Admission Guidelines  │          │
│        │ • Scholarship Info      │          │
│        │ • Gallery               │          │
│        │ • Chairman Message      │          │
│        │ • Videos                │          │
└─────────────────────────────────────────────┘
↓
Footer
```

---

## 🔗 Important URLs

| Purpose | URL |
|---------|-----|
| AdminJS Panel | http://localhost:4000/admin |
| College Details Page | http://localhost:4000/college/{collegeId} |
| Public Folder | /public/colleges/ |
| Database | Check .env for MongoDB URI |

---

## 💾 File References

```
Model Schema:      models/College.js
View Template:     views/college.ejs
Admin Config:      models/College.js (CollegeFileModel)
Controller:        controllers/College.js
Route:             routes/College.js
```

---

## 🆘 Troubleshooting Quick Fix

| Problem | Fix |
|---------|-----|
| Section not showing | Check if data exists in AdminJS |
| Images broken | Verify files in /public/colleges/ |
| Maps not embedding | Use embed URL, not watch URL |
| Videos blank | Use youtube.com/embed/ format |
| Styling looks off | Clear browser cache |
| Mobile layout wrong | Check viewport settings |
| Active nav not highlighting | Refresh page |
| Sticky sidebar not working | Check browser console |

---

## 📞 Support Resources

- See: `COLLEGE_PAGE_UPDATES.md` for detailed documentation
- See: `ADMINJS_FIELD_GUIDE.md` for detailed AdminJS guide
- Check: Browser console (F12) for error messages
- Test: Each field type individually before saving

---

## ✅ Pre-Launch Checklist

- [ ] All college data entered in AdminJS
- [ ] Gallery images uploaded to /public/colleges/
- [ ] Google Maps URL pasted correctly
- [ ] YouTube video URLs in embed format
- [ ] All sections tested and display correctly
- [ ] Mobile responsiveness verified
- [ ] Links and navigation work smoothly
- [ ] No console errors
- [ ] Contact info complete and correct
- [ ] Page loads within 3 seconds

