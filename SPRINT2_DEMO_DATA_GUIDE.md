# Sprint 2 Demo Data Guide

**Complete guide to demo data for all Sprint 2 features**

---

## 📊 Demo Data Overview

All Sprint 2 features now have comprehensive mock data for testing and demonstration.

### Data Files
- `frontend-nextjs/src/lib/data/drafts.json` - 3 drafts with complete Sprint 2 data
- `frontend-nextjs/src/lib/data/categories.json` - 5 categories
- `frontend-nextjs/src/lib/data/tags.json` - 10 tags

### API Endpoints
- `GET /api/drafts` - Get all drafts with demo data
- `GET /api/categories` - Get all categories
- `GET /api/tags` - Get all tags
- `GET /api/search?q=query` - Search across modules
- `GET /api/drafts/[id]/related` - Get related content
- `POST /api/drafts/bulk` - Bulk operations

---

## 🎯 Demo Drafts

### Draft 1: "Five Major Trends in AI Content Creation for 2025"
**Status**: pending_edit (40% progress)
**Quality Score**: 82/100

**Features Demonstrated**:
- ✅ Quality Score Card (82/100)
  - Readability: 85
  - SEO: 80
  - Tone: 88
  - Brand: 78
  - Compliance: 82
  - 2 suggestions (1 low, 1 medium severity)

- ✅ Agent Reasoning (2 agents)
  - Writer Agent (87% confidence)
    - Thinking process about AI trends
    - Data sources: Gartner, McKinsey, surveys
    - Alternatives considered
  - Editor Agent (92% confidence)
    - Content review and brand alignment
    - Grammar and style verification

- ✅ Workflow State
  - Current stage: Draft
  - Progress: 40%
  - Estimated time: 2 days
  - Stage history: 1 entry

- ✅ Content Preview
  - Markdown content with headings
  - Keywords: AI Trends, Content Creation, etc.
  - Word count: 856
  - Reading time: 4 min

- ✅ Category & Tags
  - Category: AI & Technology
  - Tags: AI Trends, Content Creation, Technology

---

### Draft 2: "How to Boost Content Marketing ROI with AI"
**Status**: edited (65% progress)
**Quality Score**: 88/100

**Features Demonstrated**:
- ✅ Quality Score Card (88/100)
  - Readability: 90
  - SEO: 85
  - Tone: 92
  - Brand: 88
  - Compliance: 85
  - 1 suggestion (low severity)

- ✅ Agent Reasoning (2 agents)
  - Writer Agent (91% confidence)
    - Analysis of content marketing challenges
    - Data sources: HubSpot, Forrester, surveys
  - SEO Agent (88% confidence)
    - Keyword analysis and optimization
    - SEO best practices verification

- ✅ Workflow State
  - Current stage: Review
  - Progress: 65%
  - Estimated time: 1 day
  - Stage history: 2 entries (Draft → Review)

- ✅ Content Preview
  - Markdown content with structure
  - Keywords: Content Marketing, ROI, AI Tools
  - Word count: 1,245
  - Reading time: 6 min

- ✅ Category & Tags
  - Category: Content Marketing
  - Tags: Content Marketing, Marketing Strategy, ROI

---

### Draft 3: "How a Tech Company Boosted Content Output by 300% with GeoCMS"
**Status**: approved (85% progress)
**Quality Score**: 95/100

**Features Demonstrated**:
- ✅ Quality Score Card (95/100)
  - Readability: 94
  - SEO: 92
  - Tone: 96
  - Brand: 98
  - Compliance: 94
  - 0 suggestions (perfect score)

- ✅ Agent Reasoning (2 agents)
  - Writer Agent (96% confidence)
    - Case study analysis and storytelling
    - Data sources: Customer metrics, analytics
  - Verifier Agent (98% confidence)
    - Claim verification and compliance
    - All statements verified and accurate

- ✅ Workflow State
  - Current stage: Approved
  - Progress: 85%
  - Estimated time: Ready for publishing
  - Stage history: 3 entries (Draft → Review → Approved)

- ✅ Content Preview
  - Markdown case study format
  - Keywords: Case Study, Success Story, Efficiency
  - Word count: 1,580
  - Reading time: 7 min

- ✅ Category & Tags
  - Category: Case Studies
  - Tags: AI Trends, Efficiency Boost, News

---

## 🔍 How to View Demo Data

### 1. Start Frontend
```bash
cd frontend-nextjs
npm run dev
```

### 2. Navigate to Drafts Page
```
http://localhost:3000/dashboard/drafts
```

### 3. Select a Draft
- Click on any draft in the left list
- Draft details appear on the right

### 4. View Each Feature Tab

**Preview Tab**:
- See real-time content preview
- Toggle device (Desktop/Tablet/Mobile)
- View SEO and social media preview

**Quality Tab**:
- See quality score (82-95)
- View 5 metrics breakdown
- See suggestions with severity levels
- Click "Apply Fix" for auto-fixable suggestions

**Reasoning Tab**:
- See agent reasoning panels
- View confidence scores (87-98%)
- Expand to see thinking process
- View data sources and alternatives

**Workflow Tab**:
- See progress bar (40-85%)
- View workflow timeline
- See stage history with timestamps
- View estimated completion time

**Related Tab**:
- See related drafts (if any)
- See related plans and knowledge
- Click to navigate to related content

**Metadata Tab**:
- See category assignment
- See tags assignment
- View draft information

---

## 📡 API Endpoints

### Get All Drafts
```bash
curl http://localhost:3000/api/drafts
```
Returns: Array of 3 drafts with all Sprint 2 data

### Get Categories
```bash
curl http://localhost:3000/api/categories
```
Returns: Array of 5 categories

### Get Tags
```bash
curl http://localhost:3000/api/tags
```
Returns: Array of 10 tags

### Search
```bash
curl "http://localhost:3000/api/search?q=AI"
```
Returns: Search results from drafts, categories, tags

### Get Related Content
```bash
curl "http://localhost:3000/api/drafts/1/related?keywords=AI,Trends"
```
Returns: Related drafts, plans, and knowledge

### Bulk Operations
```bash
curl -X POST http://localhost:3000/api/drafts/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add_tag",
    "draft_ids": [1, 2, 3],
    "data": { "tag_id": 5 }
  }'
```
Returns: Operation result

---

## ✨ Quality Score Variations

### Draft 1: 82/100 (Good)
- Shows typical quality score
- Has suggestions for improvement
- Demonstrates auto-fix feature
- Background: Yellow (60-79 range)

### Draft 2: 88/100 (Excellent)
- Shows high quality score
- Minimal suggestions
- Demonstrates SEO optimization
- Background: Green (80+ range)

### Draft 3: 95/100 (Perfect)
- Shows perfect quality score
- No suggestions needed
- Demonstrates verified content
- Background: Green (80+ range)

---

## 🤖 Agent Reasoning Variations

### Writer Agent
- Analyzes content and structure
- Provides thinking process
- Lists data sources
- Suggests alternatives
- Confidence: 87-96%

### Editor Agent
- Reviews for clarity and consistency
- Checks brand alignment
- Verifies grammar and style
- Confidence: 92%

### SEO Agent
- Analyzes keyword density
- Checks heading structure
- Verifies SEO best practices
- Confidence: 88%

### Verifier Agent
- Verifies all claims
- Checks compliance
- Validates statistics
- Confidence: 98%

---

## 📈 Workflow State Variations

### Draft 1: 40% Progress
- Stage: Draft
- Just started
- 2 days estimated
- 1 stage history entry

### Draft 2: 65% Progress
- Stage: Review
- In progress
- 1 day estimated
- 2 stage history entries

### Draft 3: 85% Progress
- Stage: Approved
- Nearly complete
- Ready for publishing
- 3 stage history entries

---

## 🎨 Categories & Tags

### Categories
1. AI & Technology
2. Content Marketing
3. Case Studies
4. Marketing Strategy
5. Product Updates

### Tags
1. urgent
2. featured
3. trending
4. tutorial
5. case-study
6. news
7. opinion
8. research
9. video
10. infographic

---

## 🧪 Testing Checklist

- [ ] All 3 drafts load correctly
- [ ] Quality scores display (82, 88, 95)
- [ ] Agent reasoning shows for each draft
- [ ] Workflow states show correct progress
- [ ] Content preview renders correctly
- [ ] Categories and tags display
- [ ] Search API returns results
- [ ] Related content displays
- [ ] Bulk operations respond correctly
- [ ] All tabs work without errors

---

## 📝 Notes

- All demo data is in JSON files (not database)
- Data persists during development session
- Changes are not saved between restarts
- Perfect for testing and demonstration
- Ready for Vercel deployment

---

**Last Updated**: 2025-10-24
**Status**: ✅ Complete and Ready for Testing

