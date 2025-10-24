# Sprint 5 Component Guide

Quick reference for all new Sprint 5 components and their usage.

---

## 🧠 Knowledge Base Components

### 1. KnowledgeCompletenessCard
**Location**: `frontend-nextjs/src/components/knowledge/KnowledgeCompletenessCard.tsx`

**Purpose**: Display knowledge content completeness scoring with visual progress indicators.

**Props**:
```typescript
interface KnowledgeCompletenessCardProps {
  data: CompletenessData;
  knowledgeId: number;
  knowledgeTopic: string;
}
```

**Features**:
- Overall completeness score (0-100%)
- Required fields progress
- Optional fields progress
- Missing fields highlighting
- Smart recommendations

**Usage**:
```tsx
<KnowledgeCompletenessCard
  data={completenessData}
  knowledgeId={1}
  knowledgeTopic="company_info"
/>
```

---

### 2. KnowledgeExpirationWarning
**Location**: `frontend-nextjs/src/components/knowledge/KnowledgeExpirationWarning.tsx`

**Purpose**: Alert users about outdated knowledge that needs updating.

**Props**:
```typescript
interface KnowledgeExpirationWarningProps {
  outdatedItems: OutdatedKnowledge[];
  onRefresh?: (id: number) => void;
}
```

**Features**:
- Critical (>180 days) and Warning (90-180 days) levels
- Quick update buttons
- Summary statistics
- Formatted timestamps

**Usage**:
```tsx
<KnowledgeExpirationWarning
  outdatedItems={outdatedKnowledge}
  onRefresh={handleRefresh}
/>
```

---

### 3. KnowledgeRecommendations
**Location**: `frontend-nextjs/src/components/knowledge/KnowledgeRecommendations.tsx`

**Purpose**: Show task-based knowledge recommendations with relevance scoring.

**Props**:
```typescript
interface KnowledgeRecommendationsProps {
  recommendations: Recommendation[];
  taskType: string;
  onSelect?: (knowledgeId: number) => void;
}
```

**Features**:
- Relevance scoring (0-100%)
- Quality star ratings
- Task type filtering
- One-click selection

**Usage**:
```tsx
<KnowledgeRecommendations
  recommendations={recs}
  taskType="content_generation"
  onSelect={handleSelect}
/>
```

---

### 4. MissingKnowledgeDetection
**Location**: `frontend-nextjs/src/components/knowledge/MissingKnowledgeDetection.tsx`

**Purpose**: Detect and alert about missing knowledge types needed for tasks.

**Props**:
```typescript
interface MissingKnowledgeDetectionProps {
  missingItems: MissingKnowledge[];
  prompt: string;
  onAddKnowledge?: (knowledgeType: string) => void;
}
```

**Features**:
- Missing knowledge detection
- Suggested fields for each type
- Quick add buttons
- Analysis summary

**Usage**:
```tsx
<MissingKnowledgeDetection
  missingItems={missing}
  prompt={userPrompt}
  onAddKnowledge={handleAdd}
/>
```

---

### 5. ImportExportDialog
**Location**: `frontend-nextjs/src/components/knowledge/ImportExportDialog.tsx`

**Purpose**: Import/export knowledge base in JSON or CSV formats.

**Props**:
```typescript
interface ImportExportDialogProps {
  onExport?: (format: 'json' | 'csv') => void;
  onImport?: (file: File, format: 'json' | 'csv') => void;
  totalItems?: number;
}
```

**Features**:
- JSON and CSV export
- File import with validation
- Format selection
- Status feedback

**Usage**:
```tsx
<ImportExportDialog
  onExport={handleExport}
  onImport={handleImport}
  totalItems={knowledgeCount}
/>
```

---

## 📋 Planning & Drafts Components

### 6. KanbanBoardEnhanced
**Location**: `frontend-nextjs/src/components/planning/KanbanBoardEnhanced.tsx`

**Purpose**: Drag-and-drop Kanban board for task management with progress tracking.

**Props**:
```typescript
interface KanbanBoardEnhancedProps {
  cards: KanbanCard[];
  onCardMove?: (cardId: number, newStatus: string) => void;
  onCardClick?: (cardId: number) => void;
  onAddCard?: (status: string) => void;
}
```

**Features**:
- Drag-and-drop cards
- Progress bars per card
- Deadline indicators
- Priority badges
- Completion tracking

**Usage**:
```tsx
<KanbanBoardEnhanced
  cards={drafts}
  onCardMove={handleMove}
  onCardClick={handleClick}
  onAddCard={handleAdd}
/>
```

---

### 7. TemplateSelector
**Location**: `frontend-nextjs/src/components/planning/TemplateSelector.tsx`

**Purpose**: Browse and select templates for content creation.

**Props**:
```typescript
interface TemplateSelectorProps {
  templates: Template[];
  onSelectTemplate?: (templateId: number) => void;
  onCreateTemplate?: () => void;
}
```

**Features**:
- Template search and filtering
- Category browsing
- Popular templates tab
- Usage statistics
- Create new template option

**Usage**:
```tsx
<TemplateSelector
  templates={allTemplates}
  onSelectTemplate={handleSelect}
  onCreateTemplate={handleCreate}
/>
```

---

### 8. DeadlineManager
**Location**: `frontend-nextjs/src/components/planning/DeadlineManager.tsx`

**Purpose**: Track and manage content deadlines with urgency levels.

**Props**:
```typescript
interface DeadlineManagerProps {
  items: DeadlineItem[];
  onUpdateDeadline?: (itemId: number, newDeadline: string) => void;
  onExtendDeadline?: (itemId: number, days: number) => void;
}
```

**Features**:
- Overdue/Today/Tomorrow/Upcoming grouping
- Quick extend options (+1, +3, +7 days)
- Priority indicators
- Summary statistics

**Usage**:
```tsx
<DeadlineManager
  items={drafts}
  onUpdateDeadline={handleUpdate}
  onExtendDeadline={handleExtend}
/>
```

---

### 9. ProgressVisualization
**Location**: `frontend-nextjs/src/components/planning/ProgressVisualization.tsx`

**Purpose**: Visualize project progress with milestones and velocity charts.

**Props**:
```typescript
interface ProgressVisualizationProps {
  milestones: Milestone[];
  totalProgress: number;
  completedCount: number;
  totalCount: number;
}
```

**Features**:
- Overall progress bar
- Milestone timeline
- Velocity chart (6-week view)
- Completion statistics
- Progress insights

**Usage**:
```tsx
<ProgressVisualization
  milestones={milestones}
  totalProgress={85}
  completedCount={17}
  totalCount={20}
/>
```

---

### 10. MultiDevicePreview
**Location**: `frontend-nextjs/src/components/drafts/MultiDevicePreview.tsx`

**Purpose**: Preview content on different device sizes (mobile/tablet/desktop).

**Props**:
```typescript
interface MultiDevicePreviewProps {
  content: string;
  title: string;
  metadata?: {
    word_count?: number;
    reading_time?: number;
    seo_score?: number;
  };
}
```

**Features**:
- Mobile (375px), Tablet (768px), Desktop (1024px) views
- Markdown rendering
- Metadata display
- Copy to clipboard
- Responsive preview

**Usage**:
```tsx
<MultiDevicePreview
  content={draftContent}
  title={draftTitle}
  metadata={contentMetadata}
/>
```

---

## 🔌 Integration Examples

### Knowledge Base Page Integration:
```tsx
import { KnowledgeCompletenessCard } from '@/components/knowledge/KnowledgeCompletenessCard';
import { KnowledgeExpirationWarning } from '@/components/knowledge/KnowledgeExpirationWarning';
import { KnowledgeRecommendations } from '@/components/knowledge/KnowledgeRecommendations';
import { ImportExportDialog } from '@/components/knowledge/ImportExportDialog';

export default function KnowledgePage() {
  return (
    <div className="space-y-4">
      <ImportExportDialog totalItems={10} />
      <KnowledgeExpirationWarning outdatedItems={outdated} />
      <KnowledgeCompletenessCard data={completeness} />
      <KnowledgeRecommendations recommendations={recs} taskType="blog" />
    </div>
  );
}
```

### Planning Page Integration:
```tsx
import { KanbanBoardEnhanced } from '@/components/planning/KanbanBoardEnhanced';
import { DeadlineManager } from '@/components/planning/DeadlineManager';
import { ProgressVisualization } from '@/components/planning/ProgressVisualization';

export default function PlanningPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <KanbanBoardEnhanced cards={drafts} />
      </div>
      <div className="space-y-4">
        <DeadlineManager items={drafts} />
        <ProgressVisualization milestones={milestones} />
      </div>
    </div>
  );
}
```

---

## 📚 Demo Data

All components work with demo data from:
- `frontend-nextjs/src/lib/data/drafts.json`
- `frontend-nextjs/src/lib/data/templates.json`
- `frontend-nextjs/src/lib/data/knowledge.json`

---

**Last Updated**: 2025-10-24  
**Version**: Sprint 5 v1.0

