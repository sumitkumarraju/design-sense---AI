# DesignSense AI 🎨✨

**DesignSense AI** is a real-time **Design Intelligence Platform** built as an Adobe Express Web Add-on. It analyzes your designs across 6 dimensions — layout, color, contrast, typography, spacing, and hierarchy — providing instant scoring, visual heatmap debugging, one-click auto-fixes, and exportable design reports.

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
- **K-Means Alignment** — Snaps elements to detected column grid
- **Equal Spacing** — Redistributes elements with uniform gaps
- **WCAG Contrast Boost** — Darkens/lightens fills for 4.5:1 ratio
- **Palette Simplification** — Merges similar hues (≤30° distance)
- **Modular Type Scale** — Applies 1.25× scale hierarchy
- **Font Consolidation** — Reduces to 2 most-used families

### 🔥 Design Heatmap Intelligence
Color-coded overlays directly on the canvas:
- 🔴 **Red** → Alignment issues
- 🟠 **Orange** → Spacing imbalance
- 🟣 **Purple** → Low contrast
- 🔵 **Blue** → Hierarchy issues

### 📊 Scoring & Grading
Weighted scores across all 6 categories with A/B/C/D/F grading.

### 📄 Report Export
Download a complete JSON design report including scores, issues, WCAG compliance, and recommended fixes.

### 🤖 AI Enhancement Layer (Optional)
Stub architecture ready for future AI integration (OpenAI, Anthropic, Gemini) for intelligent layout rearrangement, color palette generation, and typography pairing.

## 🛠️ Tech Stack

- **UI:** React 18 + TypeScript
- **Design System:** Adobe Spectrum Web Components (`@swc-react`)
- **Platform:** Adobe Express Web Add-on SDK
- **Bundler:** Webpack

## 📂 Project Structure

```text
src/
├── sandbox/
│   ├── analyzers/     # 6 analysis engines + AutoFixer
│   ├── actions/       # Modular fix modules
│   ├── scoring/       # Score calculator + severity weights
│   ├── visual/        # Heatmap overlay engine
│   └── ai/            # AI stubs (5 modules)
├── ui/
│   ├── dashboard/     # Dashboard, HeatmapToggle, ReportExport
│   ├── components/    # ScoreCard, IssueSection, etc.
│   ├── services/      # Scoring, suggestions, report generation
│   └── styles/        # CSS styles
├── models/            # Shared TypeScript interfaces
└── config/            # AI configuration
```

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

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License.
