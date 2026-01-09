# AdminJS College Fields - Data Format Guide

This guide shows you the correct format for entering data in the AdminJS admin panel for each college field.

---

## Field Entry Examples

### 1. Basic Information
```
College Name: Thames International College
College Address: Kathmandu, Nepal
University Name: Kathmandu University
Established Year: 2010
College Phone: +977-1-4123456
College Email: info@thames.edu.np
Website: https://www.thames.edu.np
```

### 2. Admission Notice & Deadline
```
Admission Notice: Applications for the academic year 2024-25 are now open!
Admission Close Date: 2024-12-31
```

### 3. Overview (Rich Text Field)
```
<p>Thames International College is one of the leading educational institutions in Nepal, 
offering quality education since 2010.</p>

<p><strong>Our Mission:</strong> To provide quality education that develops critical thinking 
and prepares students for global challenges.</p>

<ul>
  <li>State-of-the-art facilities</li>
  <li>Experienced faculty</li>
  <li>International curriculum</li>
</ul>
```

### 4. Admission Guidelines (Rich Text Field)
```
<h3>How to Apply:</h3>
<ol>
  <li>Fill the application form available at our office</li>
  <li>Submit required documents (transcript, certificates)</li>
  <li>Appear for entrance examination</li>
  <li>Interview round (if shortlisted)</li>
  <li>Final admission letter</li>
</ol>

<h3>Required Documents:</h3>
<ul>
  <li>School leaving certificate</li>
  <li>Character certificate</li>
  <li>Medical fitness report</li>
  <li>Passport size photos (4)</li>
</ul>
```

### 5. Scholarship Information (Rich Text Field)
```
<h3>Available Scholarships:</h3>

<h4>Merit-Based Scholarship</h4>
<p>Students with 80% aggregate marks are eligible for 25% fee waiver</p>

<h4>Need-Based Scholarship</h4>
<p>Students from low-income families can apply for 50% scholarship</p>

<h4>Sports Scholarship</h4>
<p>Athletes representing national teams get 30% fee waiver</p>

<p><strong>Application Deadline:</strong> March 31st every year</p>
```

### 6. Message from Chairman (Rich Text Field)
```
<p>Dear Students,</p>

<p>I am delighted to welcome you to Thames International College. Our institution 
is committed to providing the best education and nurturing the future leaders of our nation.</p>

<p>We believe in the holistic development of our students, combining academic excellence 
with character building and practical skills.</p>

<p>Best wishes for your educational journey!</p>
```

#### Chairman Name:
```
Dr. Ramesh Kumar Singh
```

### 7. Key Features
In the AdminJS panel, enter features separated by commas or new lines:

**Option A - Comma Separated:**
```
State-of-the-art Infrastructure, Experienced Faculty, International Curriculum, Scholarship Programs, Industry Partnerships, Student Exchange Programs
```

**Option B - Line by Line** (if textarea):
```
State-of-the-art Infrastructure
Experienced Faculty with International Degrees
International Curriculum Following Global Standards
Scholarship Programs for Meritorious Students
Industry Partnerships for Internships
Student Exchange Programs with Foreign Universities
Research Opportunities
Extracurricular Activities
Modern Laboratory Facilities
Career Guidance Services
```

### 8. Gallery Images
Enter filenames of images stored in `/public/colleges/` directory:

```
campus-building.jpg, library-exterior.jpg, classroom-setup.jpg, laboratory.jpg, 
sports-ground.jpg, cafeteria.jpg, student-event-1.jpg, student-event-2.jpg
```

**Important:**
- Images must be stored in `/public/colleges/` folder
- Use actual filenames with correct extensions
- Separate multiple images with commas or newlines

### 9. Google Map URL
Get the embed URL from Google Maps:

1. Go to Google Maps
2. Find your location
3. Click the location
4. Click "Share"
5. Select "Embed a map" tab
6. Copy the iframe src URL (not the whole iframe code)

**Example:**
```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.8926752833747!2d85.32849!3d27.717245!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb198a307bacc3%3A0xb5137f0374609ec0!2sThames%20International%20College!5e0!3m2!1sen!2snp!4v1234567890
```

**Important:**
- Paste ONLY the src URL
- Do NOT paste the entire `<iframe>` tag
- URL should start with `https://www.google.com/maps/embed`

### 10. Videos
Enter as a JSON-like structure or array. AdminJS will provide a form for this.

**Format:**
```
[
  {
    "title": "College Campus Tour",
    "url": "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    "title": "Student Success Stories",
    "url": "https://www.youtube.com/embed/jNQXAC9IVRw"
  },
  {
    "title": "Faculty Introduction",
    "url": "https://www.youtube.com/embed/9bZkp7q19f0"
  }
]
```

**How to Get YouTube Embed URL:**
1. Go to YouTube video
2. Click "Share"
3. Click "Embed"
4. Copy the src URL from the iframe (format: `https://www.youtube.com/embed/VIDEO_ID`)

**Important:**
- Use embed URLs, NOT watch URLs
- Embed format: `https://www.youtube.com/embed/VIDEO_ID`
- Watch format: `https://www.youtube.com/watch?v=VIDEO_ID` ❌ (WRONG)

---

## Step-by-Step Tutorial: Adding Content via AdminJS

### Step 1: Access AdminJS Panel
```
1. Go to http://localhost:4000/admin (or your AdminJS URL)
2. Login with your admin credentials
3. Navigate to "College" collection
```

### Step 2: Adding Overview
```
1. Scroll to "Overview" field
2. Click the rich text editor
3. Type or paste your overview content
4. Use formatting toolbar for bold, italic, lists, etc.
5. Click "Save"
```

### Step 3: Adding Gallery Images
```
1. Upload images to /public/colleges/ folder (via FTP or file manager)
2. In AdminJS, scroll to "Gallery Images" field
3. Enter filenames: image1.jpg, image2.jpg, image3.jpg
4. Save changes
```

### Step 4: Adding Google Maps
```
1. Open Google Maps in another tab
2. Find your college location
3. Share → Embed → Copy src URL
4. In AdminJS, paste URL into "Google Map URL" field
5. Save
```

### Step 5: Adding Videos
```
1. Find YouTube videos you want to embed
2. Get embed URLs for each
3. In AdminJS, enter in Videos field:
   {
     "title": "Video Name",
     "url": "https://www.youtube.com/embed/VIDEO_ID"
   }
4. Add multiple entries as needed
5. Save
```

---

## Common Issues & Solutions

### Issue: Images not showing in Gallery
**Solution:**
- Verify image files exist in `/public/colleges/` folder
- Check filename spelling (case-sensitive on Linux)
- Use correct file extensions (.jpg, .png, etc.)
- Ensure permissions allow reading the files

### Issue: Google Maps iframe not embedding
**Solution:**
- Verify you copied the src URL, not the entire iframe code
- URL should contain `embed?pb=`
- Not: `https://maps.google.com/` 
- Yes: `https://www.google.com/maps/embed?pb=...`

### Issue: Videos show as blank
**Solution:**
- Use YouTube embed URLs only
- Format: `https://www.youtube.com/embed/VIDEO_ID`
- Get correct VIDEO_ID from YouTube embed code
- Not: watch?v=VIDEO_ID format

### Issue: Rich text formatting not showing
**Solution:**
- Make sure to use the rich text editor (not plain text)
- Check that HTML is being rendered (use `<%-` not `<%=`)
- Verify closing tags are correct
- Test with simple HTML first

### Issue: Section not appearing on page
**Solution:**
- Verify data exists in MongoDB for that field
- Check that field is not empty in database
- Reload the page (clear cache)
- Check browser console for JavaScript errors
- Verify field names match exactly (case-sensitive)

---

## Recommended Content Length

- **Overview**: 200-400 words
- **Admission Guidelines**: 300-500 words
- **Scholarship Info**: 200-400 words
- **Chairman Message**: 150-300 words
- **Key Features**: 5-15 items
- **Gallery Images**: 8-20 images
- **Videos**: 3-10 videos

---

## SEO Best Practices

1. **Overview**: Include keywords like "college," "education," "programs"
2. **Guidelines**: Use clear, searchable language
3. **Scholarship**: Include benefits and eligibility criteria
4. **Chairman Message**: Add personal touch, authenticity
5. **Features**: Use specific, measurable achievements
6. **Images**: Use descriptive alt text (automatically set)
7. **Videos**: Include engaging, professional content

---

## Backup Recommendations

Before making major changes:
1. Export current college data from MongoDB
2. Take screenshots of current content
3. Test changes on staging environment first
4. Keep version history of important content

