import * as vscode from 'vscode';
import { findImageMatches, buildFullUrl, getCdnPrefix } from './utils';

export class RemoteImageHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const lineText = document.lineAt(position.line).text;
    const matches = findImageMatches(lineText);

    // Find the match that contains the cursor position
    const match = matches.find(
      (m) => position.character >= m.start && position.character <= m.end
    );

    if (!match) {
      return null;
    }

    const range = new vscode.Range(
      position.line,
      match.start,
      position.line,
      match.end
    );

    const cdnPrefix = getCdnPrefix(document.uri);
    if (!cdnPrefix) {
      const md = new vscode.MarkdownString();
      md.isTrusted = true;
      md.supportThemeIcons = true;
      md.appendMarkdown(`**Remote Image Preview**\n\n`);
      md.appendMarkdown(`CDN prefix is not configured.\n\n`);
      md.appendMarkdown(
        `[$(gear) Configure CDN Prefix](command:workbench.action.openSettings?%22remoteImagePreview.cdnPrefix%22)`
      );
      return new vscode.Hover(md, range);
    }

    const fullUrl = buildFullUrl(cdnPrefix, match.path);
    if (!fullUrl) {
      return null;
    }

    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;
    md.supportThemeIcons = true;

    // Display image preview with markdown image tag
    md.appendMarkdown(`![Image Preview](${fullUrl})\n\n`);
    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`**Path:** \`${match.path}\`  \n`);
    md.appendMarkdown(`**URL:** [${fullUrl}](${fullUrl})  \n\n`);
    md.appendMarkdown(`[$(link-external) Open in Browser](${fullUrl})`);

    return new vscode.Hover(md, range);
  }
}
