# Design Sense AI 🎨✨

**Design Sense AI** is an intelligent Adobe Express Web Add-on designed to help creators build accessible, aesthetically pleasing, and well-structured designs. By analyzing your document's components, it provides instant feedback, scoring, and **one-click auto-fixes** for common design issues.

## 🚀 Key Features

*   **🔍 Comprehensive Design Evaluation:** Automatically analyzes Adobe Express documents for issues related to:
    *   **Color & Contrast:** Checks WCAG contrast ratios, color palette harmonization, and highlights areas that need improvement.
    *   **Typography:** Ensures readable font sizes, proper heading hierarchy, and consistent font usage.
    *   **Layout & Alignment:** Detects overlapping elements, inconsistent spacing, and alignment issues.
*   **📈 Intelligent Scoring:** Generates a real-time health score for your design based on accessibility standards and best practices.
*   **🛠️ One-Click Auto-Fix:** Automatically resolves detected design issues, adjusting spacing, changing colors for better contrast, and fixing typography scale directly within the document sandbox.
*   **💡 Actionable Suggestions:** Provides clear checklist panels and suggestions to guide users on how to manually improve their designs.

## 🛠️ Tech Stack

*   **UI Framework:** [React 18](https://reactjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** Raw CSS with Adobe Spectrum Web Components (`@swc-react`)
*   **Platform:** [Adobe Express Web Add-on SDK](https://developer.adobe.com/express/add-ons/docs/)
*   **Bundler:** Webpack

## 📂 Project Structure

```text
design-sense/
├── src/
│   ├── sandbox/          # Document sandbox code (Photoshop/Express API interactions)
│   │   ├── analyzers/    # Logic for analyzing Color, Layout, Typography, & AutoFixer
│   │   └── code.ts       # Main sandbox entry point
│   ├── ui/               # React UI code (App UI)
│   │   ├── components/   # ScoreCard, ChecklistPanel, DesignPanel, etc.
│   │   ├── services/     # Scoring logic and Suggestions Engine
│   │   └── styles/       # CSS styles
│   ├── index.html        # UI entry HTML
│   └── manifest.json     # Adobe Express Add-on manifest
├── webpack.config.js     # Webpack configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## 🏎️ Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v16 or higher)
*   npm or yarn
*   An [Adobe Developer Account](https://developer.adobe.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sumitkumarraju/design-sense---AI.git
    cd design-sense
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Running Locally for Development

1.  Generate local SSL certificates (if you haven't already):
    ```bash
    npx @adobe/ccweb-add-on-scripts ssl
    ```
2.  Start the development server:
    ```bash
    npm start
    ```
3.  Open [Adobe Express](https://new.express.adobe.com/), go to **Add-ons > Testing**, and connect your local add-on.

### Building for Production

To create a production-ready package `.zip` file for distribution or submission to the Adobe Add-on marketplace:

```bash
npm run build
npm run package
```
*The output package will be located in the `dist` folder.*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License.
