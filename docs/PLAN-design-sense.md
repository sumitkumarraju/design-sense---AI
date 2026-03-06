# Project Plan: DesignSense AI

## 🧠 Product Vision
"AI Design Intelligence for Creative Teams"
A real-time AI design mentor inside Adobe Express that analyzes layout, spacing, hierarchy, contrast, balance, and branding — then gives smart, actionable design suggestions.

**Primary Positioning:** Professional layout intelligence tool & AI-powered creative assistant.

---

## 🏗 Architecture (Adobe Dual Runtime Model)
Respecting the Express Add-on architecture constraints:

### 1. Document Sandbox (QuickJS)
- **Role:** Pure structural + geometric analysis.
- **Capabilities:** Express Document SDK, Scene traversal, Element properties, Geometry calculations.
- **Engines:**
  - Layout Intelligence Engine
  - Visual Hierarchy Analyzer
  - Brand & Color Harmony Engine

### 2. UI Runtime (React)
- **Role:** AI reasoning, scoring, UX rendering, network requests.
- **Capabilities:** fetch, AI APIs (OpenAI/Firefly), Rendering, Animations, State management.
- **Engines:**
  - AI Suggestion Layer
  - Scoring & Weighted Aggregation Engine

---

## 🗂 File Structure Overview

```text
src/
 ├── sandbox/
 │   ├── code.ts (Entry point)
 │   ├── analyzers/
 │   │   ├── layoutAnalyzer.ts
 │   │   ├── spacingAnalyzer.ts
 │   │   ├── hierarchyAnalyzer.ts
 │   │   ├── colorAnalyzer.ts
 │   │   ├── overlapAnalyzer.ts
 │   │   └── balanceAnalyzer.ts
 │   └── models/
 │       └── DesignAnalysisResult.ts
 │
 ├── ui/
 │   ├── index.tsx (Entry point)
 │   ├── components/
 │   │   ├── DesignScoreCard.tsx
 │   │   ├── SuggestionsPanel.tsx
 │   │   ├── VisualHierarchyView.tsx
 │   │   ├── ColorAnalysisPanel.tsx
 │   │   └── LayoutHeatmap.tsx
 │   ├── services/
 │   │   ├── designScoringService.ts
 │   │   ├── suggestionEngine.ts
 │   │   └── sandboxService.ts
 │   └── models/
 │       └── DesignAnalysisResult.ts
```

---

## 🎯 Phase 1 Roadmap: Layout & Spacing Intelligence (MVP)

**Goal:** Build a highly visible, impressive demo using pure geometry (no AI API needed yet).

### Step 1: Core Data Models
Define the structured data passed between Sandbox and UI:
- `DesignIssue` (type, message, severity, elementId)
- `PageDesignAnalysis` (issues, designScore)
- `DocumentDesignAnalysis`

### Step 2: Sandbox Analyzers
Develop `layoutAnalyzer.ts` and `spacingAnalyzer.ts` to detect:
- Misaligned elements
- Uneven left margins
- Floating elements
- Proximity to edge issues
- Overlapping elements

### Step 3: UI Implementation
Based on the reference UI design:
- Build `DesignScoreCard` displaying the 0-100 overall score and component scores (Layout, Color, Typography).
- Build `SuggestionsPanel` with expandable accordions for each category (Alignment & Spacing, Visual Hierarchy, Color Harmony).
- Implement the "Fix" buttons (mock functionality for Phase 1, auto-fix in Phase 2).
- Ensure styling feels premium, matching Adobe Express aesthetics with custom CSS.

### Step 4: Integration
Connect the React UI to the complete layout analysis routine via `runtime.apiProxy(documentSandbox)`.

---

## 📝 Agent Tasks (Phase 1 Execution)

1. Scafold the Adobe Express React + TypeScript UI and Sandbox boilerplate.
2. Build the exact UI layout from the provided screenshot.
3. Define the `DesignAnalysisResult` interfaces.
4. Implement `layoutAnalyzer` for edge proximity and alignment detection.
5. Setup communication bridge so the "Analyze Design" button triggers the sandbox to return mock or real layout geometry data.

*End of Plan.*
