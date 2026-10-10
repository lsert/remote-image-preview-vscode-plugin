# Remote Image Preview (VS Code Extension)

在 VS Code 中悬停预览绝对路径指向的远端图片，并在编辑器左侧行号旁（Gutter）显示缩略图 Icon，同时为支持的图片链接添加下划线标识。

## 功能特性 (Features)

1. **悬停预览 (Hover Preview)**：鼠标移动到代码中的图片路径（如 `/images/logo.png`）时，自动拼接 CDN 前缀并在悬浮窗中预览图片。
2. **左侧缩略图 (Gutter Icon)**：在包含图片路径的代码行左侧显示缩略图标。
3. **链接下划线 (Link Underline)**：在编辑器中为识别到的有效图片链接添加下划线，清晰标识支持预览的远端图片路径。
4. **支持配置项**：
   - `remoteImagePreview.cdnPrefix`：自由配置 CDN 域名/前缀（如 `https://cdn.example.com`）。
   - `remoteImagePreview.underline`：是否在编辑器中为支持的图片链接显示下划线（默认为 `true`）。
5. **快捷命令**：按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)，输入 `Remote Image Preview: Configure CDN Prefix` 即可快速设置 CDN 前缀。
6. **支持格式**：`.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`, `.ico`, `.bmp`, `.avif`。
7. **路径规则**：仅匹配以 `/` 开头的绝对路径（例如 `/assets/banner.png`），不支持文件夹前缀（如 `./` 或 `../` 或 `@/` 别名）。

---

## 使用指南 (Usage)

### 1. 配置项说明

可以在 VS Code 设置（`settings.json`）中添加：

```json
{
  "remoteImagePreview.cdnPrefix": "https://cdn.example.com",
  "remoteImagePreview.underline": true
}
```

或者使用快捷命令配置 CDN 前缀：
1. 打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）。
2. 输入并运行 `Remote Image Preview: Configure CDN Prefix`。
3. 输入您的 CDN 基础地址（例如 `https://cdn.example.com`）。

### 2. 在代码中使用

在任意文件中书写以 `/` 开头的图片绝对路径：

```javascript
// 支持引号内的路径
const logo = "/static/images/logo.png";
const icon = '/icons/check.svg';

// 支持 CSS / HTML
<img src="/assets/hero.jpg" />
background: url(/bg/dark.webp);
```

- 代码中支持的图片链接将自动显示下划线。
- 将鼠标悬停在路径上，即可预览大图并查看 CDN 链接。
- 代码编辑器左侧（行号旁）将显示缩略图。

---

## 本地开发与调试 (Development & Debug)

1. 克隆代码后安装依赖：
   ```bash
   npm install
   ```

2. 运行测试：
   ```bash
   npm test
   ```

3. 调试运行：
   - 在 VS Code 中打开本项目。
   - 按 `F5` 键启动 **Extension Development Host**。
   - 在弹出的新窗口中配置 CDN 前缀并打开任意代码文件进行测试。

4. 打包插件文件 (.vsix)：
   ```bash
   npm run package
   ```
   打包完成后会在项目根目录生成 `remote-image-preview-0.0.1.vsix` 文件，可在 VS Code 中直接安装使用。
