import * as vscode from 'vscode';
import { findSupportedImageLinks, getCdnPrefix, isUnderlineEnabled } from './utils';

const MAX_DECORATION_CACHE = 500;
const LARGE_DOC_THRESHOLD = 3000;

export class GutterIconDecorator {
  private decorationTypes = new Map<string, vscode.TextEditorDecorationType>();
  private underlineDecorationType: vscode.TextEditorDecorationType;
  private editorDecorations = new WeakMap<vscode.TextEditor, Set<string>>();
  private debounceTimers = new Map<vscode.TextEditor, NodeJS.Timeout>();
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.underlineDecorationType = vscode.window.createTextEditorDecorationType({
      textDecoration: 'underline'
    });

    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.triggerUpdate(editor);
        }
      }),

      vscode.window.onDidChangeVisibleTextEditors((editors) => {
        for (const editor of editors) {
          this.triggerUpdate(editor);
        }
      }),

      vscode.workspace.onDidChangeTextDocument((event) => {
        for (const editor of vscode.window.visibleTextEditors) {
          if (editor.document === event.document) {
            this.triggerUpdate(editor);
          }
        }
      }),

      vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
        if (event.textEditor.document.lineCount > LARGE_DOC_THRESHOLD) {
          this.triggerUpdate(event.textEditor);
        }
      }),

      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('remoteImagePreview')) {
          this.clearAll();
          for (const editor of vscode.window.visibleTextEditors) {
            this.triggerUpdate(editor);
          }
        }
      })
    );

    // Initial run on currently visible editors
    for (const editor of vscode.window.visibleTextEditors) {
      this.triggerUpdate(editor);
    }
  }

  private triggerUpdate(editor: vscode.TextEditor) {
    const existingTimer = this.debounceTimers.get(editor);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(editor);
      this.updateEditorDecorations(editor);
    }, 150);

    this.debounceTimers.set(editor, timer);
  }

  public updateEditorDecorations(editor: vscode.TextEditor) {
    if (!editor || !editor.document) {
      return;
    }

    const doc = editor.document;
    const cdnPrefix = getCdnPrefix(doc.uri);

    // If no CDN prefix is set, clear decorations on this editor
    if (!cdnPrefix) {
      this.clearEditor(editor);
      return;
    }

    const urlToRanges = new Map<string, vscode.DecorationOptions[]>();
    const underlineRanges: vscode.Range[] = [];

    if (doc.lineCount > LARGE_DOC_THRESHOLD) {
      // Scan visible ranges with a buffer for large documents
      const buffer = 50;
      for (const visibleRange of editor.visibleRanges) {
        const startLine = Math.max(0, visibleRange.start.line - buffer);
        const endLine = Math.min(doc.lineCount - 1, visibleRange.end.line + buffer);

        for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
          const line = doc.lineAt(lineIndex);
          this.processLine(line.text, lineIndex, doc, cdnPrefix, urlToRanges, underlineRanges);
        }
      }
    } else {
      // For standard sized documents, scan line-by-line
      for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
        const line = doc.lineAt(lineIndex);
        this.processLine(line.text, lineIndex, doc, cdnPrefix, urlToRanges, underlineRanges);
      }
    }

    // Apply underline decorations
    const showUnderline = isUnderlineEnabled(doc.uri);
    editor.setDecorations(this.underlineDecorationType, showUnderline ? underlineRanges : []);

    // Get previously decorated URLs for this editor
    const previousUrls = this.editorDecorations.get(editor) || new Set<string>();
    const currentUrls = new Set<string>(urlToRanges.keys());

    // Clear decorations for URLs that are no longer present
    for (const prevUrl of previousUrls) {
      if (!currentUrls.has(prevUrl)) {
        const decType = this.decorationTypes.get(prevUrl);
        if (decType) {
          editor.setDecorations(decType, []);
        }
      }
    }

    // Apply new decorations
    for (const [url, ranges] of urlToRanges.entries()) {
      let decType = this.decorationTypes.get(url);
      if (!decType) {
        decType = vscode.window.createTextEditorDecorationType({
          gutterIconPath: vscode.Uri.parse(url),
          gutterIconSize: 'contain'
        });
        this.decorationTypes.set(url, decType);
      }
      editor.setDecorations(decType, ranges);
    }

    // Save current URL set
    this.editorDecorations.set(editor, currentUrls);

    // Prune cache if it grows too large
    this.pruneCache();
  }

  private processLine(
    lineText: string,
    lineIndex: number,
    doc: vscode.TextDocument,
    cdnPrefix: string,
    urlToRanges: Map<string, vscode.DecorationOptions[]>,
    underlineRanges: vscode.Range[]
  ) {
    const supportedLinks = findSupportedImageLinks(lineText, cdnPrefix);
    for (const link of supportedLinks) {
      const range = new vscode.Range(lineIndex, link.match.start, lineIndex, link.match.end);
      underlineRanges.push(range);

      const hoverMessage = new vscode.MarkdownString();
      hoverMessage.isTrusted = true;
      hoverMessage.supportHtml = true;
      hoverMessage.supportThemeIcons = true;
      hoverMessage.appendMarkdown(`![Image Preview](${link.fullUrl})\n\n`);
      hoverMessage.appendMarkdown(`---\n\n`);
      hoverMessage.appendMarkdown(`**Path:** \`${link.match.path}\`  \n`);
      hoverMessage.appendMarkdown(`**URL:** [${link.fullUrl}](${link.fullUrl})  \n\n`);
      hoverMessage.appendMarkdown(`[$(link-external) Open in Browser](${link.fullUrl})`);

      const decoration: vscode.DecorationOptions = {
        range,
        hoverMessage
      };

      if (!urlToRanges.has(link.fullUrl)) {
        urlToRanges.set(link.fullUrl, []);
      }
      urlToRanges.get(link.fullUrl)!.push(decoration);
    }
  }

  private clearEditor(editor: vscode.TextEditor) {
    editor.setDecorations(this.underlineDecorationType, []);
    const previousUrls = this.editorDecorations.get(editor);
    if (previousUrls) {
      for (const url of previousUrls) {
        const decType = this.decorationTypes.get(url);
        if (decType) {
          editor.setDecorations(decType, []);
        }
      }
      this.editorDecorations.delete(editor);
    }
  }

  private pruneCache() {
    if (this.decorationTypes.size <= MAX_DECORATION_CACHE) {
      return;
    }

    // Collect all active URLs across all visible editors
    const activeUrls = new Set<string>();
    for (const editor of vscode.window.visibleTextEditors) {
      const urls = this.editorDecorations.get(editor);
      if (urls) {
        for (const url of urls) {
          activeUrls.add(url);
        }
      }
    }

    // Dispose and delete decoration types not currently in use
    for (const [url, decType] of this.decorationTypes.entries()) {
      if (!activeUrls.has(url)) {
        decType.dispose();
        this.decorationTypes.delete(url);
        if (this.decorationTypes.size <= MAX_DECORATION_CACHE) {
          break;
        }
      }
    }
  }

  public clearAll() {
    for (const editor of vscode.window.visibleTextEditors) {
      this.clearEditor(editor);
    }
    for (const decType of this.decorationTypes.values()) {
      decType.dispose();
    }
    this.decorationTypes.clear();
  }

  public dispose() {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.clearAll();
    this.underlineDecorationType.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
