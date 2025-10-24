# Sprint 2 Feature Review Guide

**Purpose**: Quick reference guide to review and test all Sprint 2 features in the frontend
**Version**: v0.5 (Frontend UX Complete)
**Date**: 2025-10-24

---

## 🎯 How to Review Features

### Prerequisites
1. Start the frontend: `cd frontend-nextjs && npm run dev`
2. Navigate to: http://localhost:3000/dashboard/drafts
3. Select a draft from the left panel to view details

---

## 📋 Feature Review Checklist

### 1️⃣ Agent Transparency & Explainability

**Location**: Drafts Page → "Reasoning" Tab

**What to Review**:
- [ ] Click on a draft to select it
- [ ] Click the "Reasoning" tab in the detail panel
- [ ] Verify you see agent reasoning panel with:
  - [ ] Agent name and avatar
  - [ ] Confidence score (0-100%) with color indicator
  - [ ] "Thinking Process" section with agent's thought process
  - [ ] "Decision Rationale" explaining why this decision was made
  - [ ] "Data Sources" list showing sources used
  - [ ] "Alternatives Considered" showing other options
  - [ ] Timestamp of when reasoning was generated
- [ ] Click to expand/collapse reasoning sections
- [ ] Verify confidence score colors:
  - [ ] Green (≥80%)
  - [ ] Yellow (60-79%)
  - [ ] Red (<60%)

**Expected Behavior**:
- Reasoning panel shows expandable sections
- Confidence scores are clearly visible
- All data sources and alternatives are listed
- Timestamps are accurate

---

### 2️⃣ Content Quality Guardrails & Brand Consistency

**Location**: Drafts Page → "Quality" Tab

**What to Review**:
- [ ] Click the "Quality" tab in the detail panel
- [ ] Verify you see quality score card with:
  - [ ] Overall score (0-100) displayed prominently
  - [ ] Score breakdown showing 5 metrics:
    - [ ] Readability score
    - [ ] SEO score
    - [ ] Tone Consistency score
    - [ ] Brand Alignment score
    - [ ] Compliance score
  - [ ] Background color indicates quality level:
    - [ ] Green (≥80%)
    - [ ] Yellow (60-79%)
    - [ ] Red (<60%)
- [ ] Verify suggestions section shows:
  - [ ] Number of suggestions
  - [ ] Each suggestion has:
    - [ ] Icon (error/warning/improvement)
    - [ ] Message describing the issue
    - [ ] Category (readability, SEO, tone, brand, compliance)
    - [ ] Severity badge (low/medium/high)
    - [ ] "Show suggestion" button to expand
- [ ] Click "Show suggestion" to expand and see:
  - [ ] Detailed suggestion text
  - [ ] "Apply Fix" button (if auto-fix available)
- [ ] Click "Apply Fix" button (if available)
- [ ] Verify no issues message appears when score ≥80

**Expected Behavior**:
- Quality scores update based on content
- Suggestions are categorized and prioritized
- Auto-fix button applies improvements
- Visual indicators clearly show quality level

---

### 3️⃣ Workflow State Visibility & Progress Tracking

**Location**: Drafts Page → "Workflow" Tab

**What to Review**:
- [ ] Click the "Workflow" tab in the detail panel
- [ ] Verify you see workflow state display with:
  - [ ] Overall progress percentage (0-100%)
  - [ ] Animated progress bar showing percentage
  - [ ] Workflow timeline showing 4 stages:
    - [ ] Draft (with icon)
    - [ ] Review (with icon)
    - [ ] Approved (with icon)
    - [ ] Published (with icon)
  - [ ] Current stage highlighted with blue pulsing circle
  - [ ] Completed stages marked with green checkmark
  - [ ] Future stages shown as empty circles
- [ ] Verify stage history section shows:
  - [ ] Each stage with entry timestamp
  - [ ] Actor who moved to that stage
  - [ ] Exit timestamp (if applicable)
- [ ] Verify estimated completion time displays (if available)
- [ ] Check that timeline connects stages visually

**Expected Behavior**:
- Progress bar animates smoothly
- Current stage is clearly highlighted
- Stage history shows complete audit trail
- Estimated time is accurate

---

### 4️⃣ Content Preview & Multi-Device Rendering

**Location**: Drafts Page → "Preview" Tab

**What to Review**:
- [ ] Click the "Preview" tab in the detail panel
- [ ] Verify preview controls at top:
  - [ ] "Hide Preview" / "Show Preview" toggle button
  - [ ] Device toggle buttons:
    - [ ] Desktop button (monitor icon)
    - [ ] Tablet button (tablet icon)
    - [ ] Mobile button (phone icon)
- [ ] Click each device button and verify:
  - [ ] Desktop: Full width preview
  - [ ] Tablet: Medium width preview (max-w-2xl)
  - [ ] Mobile: Narrow width preview (max-w-sm)
  - [ ] Content renders correctly at each size
- [ ] Verify content preview shows:
  - [ ] Draft title as H1
  - [ ] Keywords as colored badges
  - [ ] Full content rendered with markdown
  - [ ] Proper formatting and styling
- [ ] Verify SEO Preview section shows:
  - [ ] URL preview
  - [ ] SEO title
  - [ ] SEO description (first 155 chars)
  - [ ] Formatted like Google search result
- [ ] Verify Social Media Preview sections:
  - [ ] Twitter preview with title, description, URL
  - [ ] LinkedIn preview with title, description, URL
  - [ ] Both show how content appears on social platforms
- [ ] Click "Hide Preview" to collapse preview
- [ ] Click "Show Preview" to expand again

**Expected Behavior**:
- Device toggle changes preview width
- Content renders correctly at all sizes
- SEO preview matches actual content
- Social media previews are formatted correctly
- Preview can be toggled on/off

---

### 5️⃣ Module Integration & Cross-Module Workflows

#### A. Unified Search

**Location**: Global search component (if integrated in header)

**What to Review**:
- [ ] Look for search input in the interface
- [ ] Click on search input
- [ ] Type a search query (e.g., "content", "draft", "plan")
- [ ] Verify search results show:
  - [ ] Results from multiple modules (drafts, plans, knowledge, etc.)
  - [ ] Each result has icon indicating type
  - [ ] Result title and description
  - [ ] Result type label
- [ ] Verify recent searches section shows:
  - [ ] Previously searched terms
  - [ ] Clock icon for recent searches
- [ ] Verify quick links section shows:
  - [ ] View All Drafts
  - [ ] View All Plans
  - [ ] View Knowledge Base
- [ ] Click on a search result to navigate

**Expected Behavior**:
- Search returns results from all modules
- Recent searches are saved and displayed
- Quick links provide easy navigation
- Results are clickable and navigate correctly

#### B. Related Content Panel

**Location**: Drafts Page → "Related" Tab

**What to Review**:
- [ ] Click the "Related" tab in the detail panel
- [ ] Verify related content panel shows:
  - [ ] Related Drafts section (if any):
    - [ ] Draft title
    - [ ] Word count
    - [ ] Clickable link to draft
  - [ ] Related Plans section (if any):
    - [ ] Plan title
    - [ ] Status badge
    - [ ] Clickable link to plan
  - [ ] Related Knowledge section (if any):
    - [ ] Knowledge topic
    - [ ] Description
    - [ ] Clickable link to knowledge
- [ ] Verify each section has appropriate icon:
  - [ ] Blue icon for drafts
  - [ ] Purple icon for plans
  - [ ] Green icon for knowledge
- [ ] Click on a related item to navigate to it
- [ ] Verify "No related content" message appears when none exist

**Expected Behavior**:
- Related content is organized by type
- Each item is clickable and navigates correctly
- Icons clearly indicate content type
- Empty state message is helpful

#### C. Category & Tag Selector

**Location**: Drafts Page → "Metadata" Tab

**What to Review**:
- [ ] Click the "Metadata" tab in the detail panel
- [ ] Verify Category section shows:
  - [ ] "Category" label
  - [ ] Dropdown button showing current category (or "Select a category")
  - [ ] Click dropdown to see category list
  - [ ] Each category shows name and description
  - [ ] "Clear category" option at top
  - [ ] Selected category is highlighted in blue
- [ ] Verify Tags section shows:
  - [ ] "Tags" label
  - [ ] Selected tags displayed as colored badges with X to remove
  - [ ] "Add tags" button with plus icon
  - [ ] Click to open tag dropdown
  - [ ] Tag list with checkboxes
  - [ ] Selected tags are checked
  - [ ] Can toggle tags on/off
- [ ] Select a category and verify it updates
- [ ] Add/remove tags and verify they update
- [ ] Verify tags can be removed by clicking X on badge

**Expected Behavior**:
- Category dropdown shows all available categories
- Tags can be added/removed easily
- Selected items are clearly highlighted
- Changes update immediately

#### D. Bulk Operations

**Location**: Drafts Page → Bottom right corner (when drafts selected)

**What to Review**:
- [ ] Select multiple drafts by clicking checkboxes in the list
- [ ] Verify floating action button appears at bottom right showing:
  - [ ] Number of selected items
  - [ ] Checkmark icon
  - [ ] Blue background
- [ ] Click the floating button to open menu
- [ ] Verify menu shows options:
  - [ ] Add Tags
  - [ ] Add Category
  - [ ] Archive
  - [ ] Duplicate
  - [ ] Delete (in red)
- [ ] Verify selection info shows "X items selected"
- [ ] Click on a bulk action (e.g., "Archive")
- [ ] Verify action is applied to all selected items
- [ ] Verify button disappears when no items selected

**Expected Behavior**:
- Floating button appears only when items are selected
- Menu shows all available bulk actions
- Actions apply to all selected items
- Selection count is accurate

---

## 🔍 Additional Verification

### Responsive Design
- [ ] Test on desktop (full width)
- [ ] Test on tablet (medium width)
- [ ] Test on mobile (narrow width)
- [ ] Verify all tabs and components are accessible

### Performance
- [ ] Verify page loads quickly
- [ ] Verify no console errors
- [ ] Verify smooth animations and transitions

### Accessibility
- [ ] Verify all buttons are clickable
- [ ] Verify all text is readable
- [ ] Verify color contrast is sufficient
- [ ] Verify keyboard navigation works

---

## 📝 Testing Notes

**Test Data**:
- Use existing drafts in the system
- If no drafts exist, create test data first

**Browser Compatibility**:
- Test in Chrome/Edge (Chromium)
- Test in Firefox
- Test in Safari (if available)

**Known Limitations**:
- Some features require backend API endpoints
- Mock data may be used for demonstration
- Some features may show placeholder data

---

## 🐛 Issue Reporting

If you find any issues:

1. **Document the issue**:
   - Feature name
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)

2. **Create a GitHub issue** with:
   - Title: `[Sprint 2] Feature Name - Issue Description`
   - Description: Detailed steps and screenshots
   - Label: `bug` or `enhancement`

3. **Reference this guide** in the issue

---

## ✅ Sign-Off Checklist

After reviewing all features:

- [ ] All 5 features reviewed
- [ ] All tabs and components tested
- [ ] Responsive design verified
- [ ] No console errors
- [ ] All interactions work as expected
- [ ] Documentation is clear and helpful

---

**Review Date**: _______________
**Reviewer Name**: _______________
**Status**: _______________

---

**Questions?** Refer to:
- `SPRINT2_FINAL_REPORT.md` - Executive summary
- `SPRINT2_COMPLETION_SUMMARY.md` - Detailed completion info
- `docs/00_BACKLOG.md` - Sprint 2 task details

