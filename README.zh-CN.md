# Remote Image Preview (VS Code 扩展插件)

[English](README.md) | [简体中文](README.zh-CN.md)

**Remote Image Preview** 是一款用于 Visual Studio Code 的轻量高效扩展插件。它支持在鼠标悬停时预览远端图片，并在编辑器左侧行号旁（Gutter）显示缩略图。通过配置 CDN 前缀与路径前缀，插件可智能识别源代码中的图片路径，提供下划线标识、悬停大图卡片以及对 SVG 单色图标的自适应渲染。

---

## ✨ 核心特性

- **🔍 鼠标悬停预览 (Hover Preview)**：将鼠标悬停在图片路径上，自动弹出预览卡片，展示大图预览、本地路径、完整 CDN URL 以及一键在浏览器中打开的快捷链接。
- **🖼️ 边栏缩略图 (Gutter Icon)**：在对应代码行的行号旁显示高清缩略图标。
- **🎨 完整 SVG 支持与主题色适配**：全面支持远程 SVG 在悬浮卡片与边栏图标中的预览。自动将 `currentColor` 替换为可配置的颜色（默认白色 `#ffffff`，在 VS Code 深色背景下清晰可见），并自动补充缺失的 `viewBox` 以实现高质量矢量缩放。
- **📏 放大边栏图标**：边栏图标大小可配置（默认为 `cover`），放大并占满整行高度，避免被默认边距缩小。
- **🏷️ 支持路径前缀配置**：支持配置源码匹配的路径前缀（默认为 `/`，亦可自定义为 `/static/`、`@/` 等）。
- **🔗 智能下划线高亮**：在编辑器中为匹配到的图片链接添加下划线，一目了然。
- **⚡ 高效内存缓存与并发合并**：基于路径与颜色组合的内存缓存，避免频繁悬停或滚动时发起重复网络请求。
- **⌨️ 便捷配置命令**：支持通过命令面板快速配置与切换 CDN 前缀。

---

## ⚙️ 配置项详解

您可以在 VS Code 的 `settings.json` 中配置，或通过 VS Code 设置面板（快捷键 `Ctrl+,` 或 `Cmd+,`）搜索 **Remote Image Preview** 进行可视化修改。

| 配置项 | 类型 | 默认值 | 详细作用与说明 |
| :--- | :--- | :--- | :--- |
| `remoteImagePreview.cdnPrefix` | `string` | `""` | **CDN 基础域名/前缀**。<br>用于拼接在代码中匹配到的图片路径前（例如 `https://cdn.example.com` 或 `https://storage.googleapis.com/my-bucket`）。若省略协议头，插件会自动补齐 `https://`。 |
| `remoteImagePreview.pathPrefix` | `string` | `"/"` | **代码中匹配图片路径的前缀**。<br>默认为 `"/"`（匹配类似 `"/images/hero.png"` 的绝对路径）。如需仅识别特定目录或特殊别名，可配置为 `"/static/"`、`"/assets/"` 或 `"@/"` 等。 |
| `remoteImagePreview.underline` | `boolean` | `true` | **是否在编辑器中为图片链接添加下划线**。<br>设为 `true` 时为匹配到的链接展示下划线标识；设为 `false` 则关闭下划线（悬停预览与边栏图标依然正常生效）。 |
| `remoteImagePreview.gutterIconSize` | `string` | `"cover"` | **边栏（Gutter）图标大小模式**。<br>可选值：`"cover"`, `"contain"`, `"100%"`, `"120%"`, `"auto"`。<br>默认为 `"cover"`，放大图标以填满整行行高；若希望保留默认内边距缩放，可设为 `"contain"`。 |
| `remoteImagePreview.svgCurrentColor` | `string` | `"#ffffff"` | **SVG 中 `currentColor` 的替换颜色**。<br>默认值为 `"#ffffff"`（白色）。在单色 SVG 图标中，`currentColor` 通常继承自前景色；在 VS Code 深色主题下黑色图标容易看不清，通过此项可统一替换为明亮的白色或任意十六进制颜色（例如 `"#e0e0e0"`、`"white"`）。 |

### 完整配置示例 (`settings.json`)

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

## 🚀 使用方法

### 1. 配置 CDN 前缀

打开命令面板（Windows/Linux 按 `Ctrl+Shift+P`，macOS 按 `Cmd+Shift+P`）：
1. 输入并运行 `Remote Image Preview: Configure CDN Prefix`。
2. 输入您的 CDN 基础地址（例如 `https://cdn.example.com`）。
3. 回车确认后即自动保存到用户配置中。

也可以直接在 `settings.json` 中配置 `remoteImagePreview.cdnPrefix`。

### 2. 在代码中书写图片路径

插件会自动扫描当前打开的代码文件，识别以配置前缀开头并以常见图片后缀结尾的路径：

```javascript
// JavaScript / TypeScript / JSON 引号字符串
const heroImage = "/static/images/hero.png";
const monoIcon = "/icons/mono/account.svg";

// HTML / JSX 属性
<img src="/assets/banners/summer-sale.jpg" alt="Summer Sale" />

// CSS url() 语法
.background {
  background-image: url(/static-lib/img/pattern.webp);
}
```

- **编辑器内**：符合规则的链接显示下划线。
- **行号左侧**：左侧边栏即时显示微缩图。
- **鼠标悬停**：鼠标悬停在路径上，即可查看高清大图与详情。

### 3. 支持的图片格式

- `.png`
- `.jpg` / `.jpeg`
- `.svg`
- `.gif`
- `.webp`
- `.ico`
- `.bmp`
- `.avif`

---

## 🛠️ 快捷命令

| 命令名称 | 命令标题 | 描述 |
| :--- | :--- | :--- |
| `remoteImagePreview.configureCdn` | `Remote Image Preview: Configure CDN Prefix` | 弹出输入框快速修改 CDN 前缀并保存到全局设置。 |

---

## 🧪 本地开发与测试

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **编译代码**：
   ```bash
   npm run compile
   ```

3. **运行单元测试**：
   ```bash
   npm test
   ```

4. **启动调试**：
   - 在 VS Code 中打开本项目。
   - 按 `F5` 键启动 **Extension Development Host** 新窗口。
   - 在新窗口中配置 CDN 前缀并打开包含图片路径的代码进行测试。

5. **打包安装包 (.vsix)**：
   ```bash
   npm run package
   ```
   打包完成后会在根目录生成 `remote-image-preview-0.0.1.vsix` 文件，可在 VS Code 扩展面板中选择 "从 VSIX 安装..." 直接安装。

---

## 📄 开源许可

MIT License.
