# DesignSense AI 🎨✨

**DesignSense AI** is a real-time **Design Intelligence Platform** built as an Adobe Express Web Add-on. It analyzes designs across 6 dimensions, provides instant scoring, visual heatmap debugging, one-click auto-fixes, AI-powered suggestions via Adobe Firefly, and exportable PDF reports.

---

## 🚀 Key Features

### 🔍 6-Dimension Analysis Engine
| Dimension | What It Checks |
|-----------|---------------|
| **Layout** | Alignment consistency, grid detection, focal point |
| **Color** | Palette size, harmony, dominance, WCAG contrast |
| **Contrast** | WCAG AA (4.5:1), AAA (7:1), large text (3:1) |
| **Typography** | Heading hierarchy, font family count, size consistency |
| **Spacing** | Horizontal/vertical gaps, margin balance, whitespace |
| **Hierarchy** | Size dominance, position priority, visual weight |

### 🛠️ One-Click Auto-Fix Engine
| Fixer | Algorithm |
|-------|-----------|
| **Gentle Alignment** | Groups nearby elements by proximity, snaps near-misses to group median (not destructive K-Means) |
| **Vertical Alignment** | Same proximity + median approach for Y-axis |
| **Equal Spacing** | Redistributes elements with uniform vertical/horizontal gaps |
| **WCAG Contrast Boost** | Smartly darkens or lightens fills for 4.5:1 ratio (handles text + shapes) |
| **Palette Simplification** | Merges similar hues (≤30° distance) |
| **Modular Type Scale** | Applies 1.25× scale hierarchy |
| **Font Consolidation** | Reduces to 2 most-used font families |

### 🔥 Design Heatmap Intelligence
Color-coded overlays directly on the canvas:
- 🔴 **Red** → Alignment issues
- 🟠 **Orange** → Spacing imbalance
- 🟣 **Purple** → Low contrast
- 🔵 **Blue** → Hierarchy / focal issues
- 🟡 **Gold** → Too many colors

**How it works:** Runs all 6 analyzers → draws stroke rectangles via `editor.makeStroke()` on flagged elements → tagged with `addOnData` for reliable cleanup → click again to clear all overlays.

### 📊 Scoring & Grading
Weighted scores across all 6 categories with **A/B/C/D/F** grading system using configurable severity weights.

### 📄 PDF Report Export
Exports a **styled HTML report** (Print-to-PDF) with:
- Score circle + grade
- Category progress bars
- WCAG AA/AAA compliance badges
- Full issue table with severity + suggested fixes

### 🤖 Adobe Firefly AI Integration
- **OAuth2 authentication** via Adobe IMS
- **Image generation** via Firefly v3 API
- **AI design suggestions** — hybrid rule-based + Firefly-powered
- **Color palette generation** — 8 curated palettes + algorithmic generation
- **Typography AI** — modular scale suggestions + curated font pairings
- **Layout AI** — column detection + element sizing analysis

#### How to Connect
1. Get credentials from [Adobe Developer Console](https://developer.adobe.com/developer-console/)
2. Open add-on → click **"Adobe Firefly AI ▼"**
3. Enter **Client ID** + **Client Secret**
4. Click **"🔗 Connect to Firefly"**
5. Click **"✨ AI Improve Design"** for suggestions

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI** | React 18 + TypeScript |
| **Design System** | Adobe Spectrum Web Components (`@swc-react`) |
| **Platform** | Adobe Express Web Add-on SDK |
| **Document SDK** | `express-document-sdk` (runtime external) |
| **Bundler** | Webpack 5 |
| **AI** | Adobe Firefly API (v3) |

---

## 📂 Project Structure

```text
src/
├── sandbox/
│   ├── analyzers/          # 6 analysis engines + AutoFixer dispatcher
│   │   ├── LayoutAnalyzer.ts
│   │   ├── ColorAnalyzer.ts
│   │   ├── ContrastAnalyzer.ts
│   │   ├── TypographyAnalyzer.ts
│   │   ├── SpacingAnalyzer.ts
│   │   ├── HierarchyAnalyzer.ts
│   │   └── AutoFixer.ts         # Thin dispatcher → modular fixers
│   ├── actions/            # Modular fix modules
│   │   ├── AlignmentFixer.ts    # Near-miss alignment (10px threshold)
│   │   ├── SpacingFixer.ts      # Vertical + horizontal spacing
│   │   ├── ColorFixer.ts        # WCAG contrast + palette (uses editor.makeColorFill)
│   │   └── TypographyFixer.ts   # Type scale + font consolidation
│   ├── scoring/            # Score calculator + severity weights
│   ├── visual/             # Heatmap engine (uses editor.makeStroke + addOnData)
│   ├── ai/                 # AI engines (Firefly-powered)
│   │   ├── AIProvider.ts
│   │   ├── ColorAIEngine.ts
│   │   ├── LayoutAIEngine.ts
│   │   ├── TypographyAIEngine.ts
│   │   └── PaletteGenerator.ts
│   ├── models/             # Sandbox-side TypeScript interfaces
│   └── code.ts             # Sandbox entry point (API surface)
├── ui/
│   ├── dashboard/          # Dashboard, AISettings, HeatmapToggle, ReportExport
│   ├── components/         # ScoreCard, IssueSection, CategoryPills
│   ├── services/           # reportService, fireflyService
│   └── styles/             # Dashboard.css, AISettings.css
├── models/                 # Shared TypeScript interfaces
└── config/                 # AI configuration
```

---

## 🏎️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v16+
- [Adobe Developer Account](https://developer.adobe.com/)

### Installation
```bash
git clone https://github.com/sumitkumarraju/design-sense---AI.git
cd design-sense
npm install
```

### Development
```bash
npm start
```
Open [Adobe Express](https://new.express.adobe.com/) → **Add-ons → Testing** → connect local add-on.

### Production Build
```bash
npm run build
npm run package
```

---

## 📋 Changelog

### v2.1 — SDK API Fix & Reliability
- **Root cause fix**: All fill/stroke assignments now use correct Express Document SDK APIs
  - `editor.makeColorFill(color)` for fills (was incorrectly using `colorUtils.fromHex()` directly)
  - `editor.makeStroke({color, width})` for strokes (was incorrectly using raw object assignment)
  - `addOnData.setItem()` for heatmap tagging (was incorrectly using `.name` property)
- **Heatmap**: Now reliably draws + clears overlays with dual cleanup (ID tracking + addOnData)
- **Contrast fixer**: Actually applies darkened colors to elements
- **Alignment fixer**: Near-miss only (10px threshold) — never rearranges intentional positioning

### v2.0 — Design Intelligence Platform
- **6-Dimension Analysis**: Added Spacing, Hierarchy, Contrast analyzers
- **Modular Fixers**: AlignmentFixer (gentle nudge), SpacingFixer, ColorFixer, TypographyFixer
- **Scoring Engine**: Weighted 6-category scoring with A-F grading
- **Heatmap Engine**: Color-coded visual overlays on canvas
- **PDF Report Export**: Styled HTML reports via Print-to-PDF
- **Adobe Firefly AI**: OAuth2 auth, image generation, design suggestions, palette generation
- **AI Dashboard UI**: Settings panel, AI Improve button, suggestion cards

### v1.0 — Initial Add-on
- Layout, Color, Typography analyzers
- Basic auto-fix (K-Means alignment)
- Score display + issue list

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License.
