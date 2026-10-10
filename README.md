# Remote Image Preview (VS Code Extension)

[English](README.md) | [简体中文](README.zh-CN.md)

**Remote Image Preview** is a Visual Studio Code extension that allows you to preview remote images on hover and in the editor gutter based on configured CDN and path prefixes. It automatically identifies image paths in your source files, decorates them with underlines, displays gutter icons next to line numbers, and presents rich hover cards with high-fidelity previews (including full SVG support with theme color adaptation).

---

## ✨ Features

- **🔍 Hover Preview**: Hovering over an image path pops up a preview card displaying the image, its local path, full CDN URL, and a one-click link to open it in your browser.
- **🖼️ Gutter Icon Thumbnail**: Displays an image thumbnail directly in the gutter (next to the line numbers).
- **🎨 Full SVG Support & Theme Color Handling**: Seamlessly renders remote SVGs in both hover cards and gutter icons. Automatically replaces `currentColor` with a configurable color (defaults to `#ffffff` for optimal contrast on dark backgrounds) and injects missing `viewBox` attributes for vector scaling.
- **📏 Enlarged Gutter Icons**: Configurable gutter icon sizing (defaults to `cover`) to enlarge and fill the line-height space without being shrunk by margins.
- **🏷️ Configurable Path Prefix**: Supports matching paths with custom prefixes (defaults to `/`, e.g. `/`, `/static/`, or `@/`).
- **🔗 Link Underlines**: Subtle underlines highlight supported remote image paths in your code for effortless recognition.
- **⚡ Smart Caching & Request Merging**: In-memory caching keyed by image path and color prevents duplicate network requests and delivers instant response times.
- **⌨️ Quick Commands**: Quickly update your CDN prefix through the VS Code Command Palette.

---

## ⚙️ Configuration Settings

Configure these settings in your VS Code `settings.json` or in the Settings UI under **Remote Image Preview**.

| Setting Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `remoteImagePreview.cdnPrefix` | `string` | `""` | The CDN base URL to prepend to image paths (e.g. `https://cdn.example.com` or `https://my-bucket.storage.googleapis.com`). Protocol (`https://`) is automatically prepended if omitted. |
| `remoteImagePreview.pathPrefix` | `string` | `"/"` | Path prefix used to identify and match image paths in source code. Defaults to `"/"` (matching paths like `"/images/hero.png"`). Can be set to custom prefixes such as `"/static/"`, `"/assets/"`, or `"@/"`. |
| `remoteImagePreview.underline` | `boolean` | `true` | Whether to display an underline under matched image links in the editor. Set to `false` to disable link underlines while keeping hover and gutter previews active. |
| `remoteImagePreview.gutterIconSize` | `string` | `"cover"` | Sizing mode for the gutter icon. Available values: `"cover"`, `"contain"`, `"100%"`, `"120%"`, `"auto"`. Default is `"cover"`, which enlarges the icon to fill the gutter line-height slot. |
| `remoteImagePreview.svgCurrentColor` | `string` | `"#ffffff"` | Color value used to replace `currentColor` in SVG preview images (e.g. `"#ffffff"`, `"#e0e0e0"`, or `"white"`). Defaults to white so monochrome icons stay clearly visible against dark editor backgrounds. |

### Configuration Example (`settings.json`)

```json
{
  "remoteImagePreview.cdnPrefix": "https://cdn.example.com",
  "remoteImagePreview.pathPrefix": "/",
  "remoteImagePreview.underline": true,
  "remoteImagePreview.gutterIconSize": "cover",
  "remoteImagePreview.svgCurrentColor": "#ffffff"
}
```

---

## 🚀 Usage

### 1. Configure Your CDN Prefix

Open the Command Palette (`Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on macOS):
1. Type and run `Remote Image Preview: Configure CDN Prefix`.
2. Enter your CDN base URL (e.g. `https://cdn.example.com`).
3. Press Enter. The setting will be saved to your user settings.

Alternatively, add `remoteImagePreview.cdnPrefix` directly into your workspace or user `settings.json`.

### 2. Supported Path Formats in Code

The extension scans open source files for paths matching your configured `pathPrefix` and ending with supported image extensions:

```javascript
// Quoted strings in JavaScript / TypeScript / JSON
const heroImage = "/static/images/hero.png";
const monoIcon = "/icons/mono/account.svg";

// HTML / JSX attributes
<img src="/assets/banners/summer-sale.jpg" alt="Summer Sale" />

// CSS url() functions
.background {
  background-image: url(/static-lib/img/pattern.webp);
}
```

- **In the editor**: Paths are underlined (if enabled).
- **In the gutter**: An icon appears on the left margin for quick visual reference.
- **On hover**: Hovering your cursor over the path displays the image card.

### 3. Supported Image Formats

- `.png`
- `.jpg` / `.jpeg`
- `.svg`
- `.gif`
- `.webp`
- `.ico`
- `.bmp`
- `.avif`

---

## 🛠️ Commands

| Command | Title | Description |
| :--- | :--- | :--- |
| `remoteImagePreview.configureCdn` | `Remote Image Preview: Configure CDN Prefix` | Prompts for a CDN base URL and saves it globally to settings. |

---

## 🧪 Development & Testing

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Compile TypeScript**:
   ```bash
   npm run compile
   ```

3. **Run unit tests**:
   ```bash
   npm test
   ```

4. **Launch Extension in Debug Mode**:
   - Open the repository in VS Code.
   - Press `F5` to start the **Extension Development Host**.
   - Test previewing images in the newly opened VS Code window.

5. **Package into `.vsix`**:
   ```bash
   npm run package
   ```
   The generated `.vsix` file can be installed via VS Code's "Install from VSIX..." command.

---

## 📄 License

MIT License.
