# Sprint 2 Quick Reference Card

**Quick access guide to Sprint 2 features**

---

## 🚀 Quick Start

```bash
# Start frontend
cd frontend-nextjs
npm run dev

# Navigate to
http://localhost:3000/dashboard/drafts
```

---

## 📍 Feature Locations

| Feature | Location | Tab | How to Access |
|---------|----------|-----|---------------|
| **Agent Reasoning** | Drafts Page | "Reasoning" | Select draft → Click Reasoning tab |
| **Quality Score** | Drafts Page | "Quality" | Select draft → Click Quality tab |
| **Workflow State** | Drafts Page | "Workflow" | Select draft → Click Workflow tab |
| **Content Preview** | Drafts Page | "Preview" | Select draft → Click Preview tab |
| **Related Content** | Drafts Page | "Related" | Select draft → Click Related tab |
| **Category/Tags** | Drafts Page | "Metadata" | Select draft → Click Metadata tab |
| **Bulk Operations** | Drafts List | Floating Button | Select multiple drafts → Button appears |
| **Unified Search** | Global | Search Bar | Look for search input in header |

---

## ✨ Feature Highlights

### 1. Reasoning Tab
- **Shows**: Agent thinking process, confidence scores, data sources
- **Look for**: Expandable sections with agent reasoning
- **Color codes**: Green (≥80%), Yellow (60-79%), Red (<60%)

### 2. Quality Tab
- **Shows**: Quality score (0-100), 5 metrics, suggestions
- **Look for**: Score breakdown, suggestion list with severity
- **Action**: Click "Apply Fix" to auto-fix suggestions

### 3. Workflow Tab
- **Shows**: Progress bar, workflow timeline, stage history
- **Look for**: 4 stages (Draft → Review → Approved → Published)
- **Color codes**: Green (completed), Blue (current), Gray (future)

### 4. Preview Tab
- **Shows**: Real-time content preview, SEO preview, social preview
- **Look for**: Device toggle (Desktop/Tablet/Mobile)
- **Action**: Click device buttons to change preview size

### 5. Related Tab
- **Shows**: Related drafts, plans, knowledge
- **Look for**: Organized by content type with icons
- **Action**: Click items to navigate to related content

### 6. Metadata Tab
- **Shows**: Category selector, tag selector, draft info
- **Look for**: Dropdown for category, checkboxes for tags
- **Action**: Select/deselect to link content

### 7. Bulk Operations
- **Shows**: Floating button with selection count
- **Look for**: Button at bottom right when items selected
- **Actions**: Tag, Categorize, Archive, Duplicate, Delete

---

## 🎯 Testing Checklist

### Reasoning Tab
- [ ] Confidence score displays (0-100%)
- [ ] Color indicator matches score
- [ ] Thinking process is readable
- [ ] Data sources are listed
- [ ] Alternatives are shown
- [ ] Sections expand/collapse

### Quality Tab
- [ ] Overall score displays
- [ ] 5 metrics show breakdown
- [ ] Suggestions are listed
- [ ] Severity badges show (low/medium/high)
- [ ] "Apply Fix" button works
- [ ] No issues message appears when score ≥80

### Workflow Tab
- [ ] Progress bar shows percentage
- [ ] 4 stages are visible
- [ ] Current stage is highlighted
- [ ] Stage history shows timestamps
- [ ] Estimated time displays (if available)

### Preview Tab
- [ ] Preview shows content
- [ ] Device toggle works (Desktop/Tablet/Mobile)
- [ ] SEO preview shows title/meta/snippet
- [ ] Social previews show (Twitter/LinkedIn)
- [ ] Hide/Show toggle works

### Related Tab
- [ ] Related content displays
- [ ] Content organized by type
- [ ] Icons show content type
- [ ] Items are clickable
- [ ] Empty state shows when no related content

### Metadata Tab
- [ ] Category dropdown works
- [ ] Tags can be added/removed
- [ ] Selected items highlight
- [ ] Draft info displays (word count, version, etc.)

### Bulk Operations
- [ ] Button appears when items selected
- [ ] Selection count is accurate
- [ ] Menu shows all actions
- [ ] Actions apply to all selected items
- [ ] Button disappears when no items selected

---

## 🔧 Common Actions

### Select a Draft
1. Go to Drafts page
2. Click on a draft in the left list
3. Draft details appear on the right

### View Agent Reasoning
1. Select a draft
2. Click "Reasoning" tab
3. Click agent name to expand reasoning

### Check Quality Score
1. Select a draft
2. Click "Quality" tab
3. Review score and suggestions
4. Click "Apply Fix" for auto-fixes

### Preview Content
1. Select a draft
2. Click "Preview" tab
3. Click device buttons to change size
4. Review SEO and social previews

### Find Related Content
1. Select a draft
2. Click "Related" tab
3. Click related items to navigate

### Bulk Edit Drafts
1. Check multiple drafts in list
2. Click floating button (bottom right)
3. Select action from menu
4. Action applies to all selected

---

## 📊 Visual Indicators

### Confidence Scores
- 🟢 Green: ≥80% (High confidence)
- 🟡 Yellow: 60-79% (Medium confidence)
- 🔴 Red: <60% (Low confidence)

### Quality Scores
- 🟢 Green: ≥80% (Excellent)
- 🟡 Yellow: 60-79% (Good)
- 🔴 Red: <60% (Needs improvement)

### Severity Levels
- 🔴 High: Critical issues
- 🟡 Medium: Important issues
- 🔵 Low: Minor suggestions

### Workflow Stages
- ✅ Green checkmark: Completed
- 🔵 Blue circle: Current stage
- ⭕ Gray circle: Future stage

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Tab doesn't show | Refresh page or select different draft |
| Preview not loading | Check if content is valid markdown |
| Related content empty | Draft may not have keywords or related items |
| Bulk button not showing | Make sure multiple drafts are selected |
| Quality score missing | Backend may not have calculated score yet |

---

## 📚 Full Documentation

For detailed information, see:
- `SPRINT2_FEATURE_REVIEW_GUIDE.md` - Complete review guide
- `SPRINT2_FINAL_REPORT.md` - Executive summary
- `SPRINT2_COMPLETION_SUMMARY.md` - Detailed completion info
- `docs/00_BACKLOG.md` - Sprint 2 task details

---

## ✅ Review Checklist

- [ ] All 5 features reviewed
- [ ] All tabs tested
- [ ] Responsive design verified
- [ ] No console errors
- [ ] All interactions work
- [ ] Ready for production

---

**Last Updated**: 2025-10-24
**Version**: v0.5
**Status**: ✅ Ready for Review

