import * as vscode from "vscode";
import { findImageMatches, buildFullUrl, getCdnPrefix, getSvgCurrentColor, getPathPrefix } from "./utils";
import { svgService } from "./svgService";
import { logger } from "./logger";

export class RemoteImageHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.Hover | null> {
    const lineText = document.lineAt(position.line).text;
    const pathPrefix = getPathPrefix(document.uri);
    const matches = findImageMatches(lineText, pathPrefix);

    // Find the match that contains the cursor position
    const match = matches.find(
      (m) => position.character >= m.start && position.character <= m.end,
    );

    if (!match) {
      return null;
    }

    const range = new vscode.Range(
      position.line,
      match.start,
      position.line,
      match.end,
    );

    const cdnPrefix = getCdnPrefix(document.uri);
    if (!cdnPrefix) {
      const md = new vscode.MarkdownString();
      md.isTrusted = true;
      md.supportThemeIcons = true;
      md.appendMarkdown(`**Remote Image Preview**\n\n`);
      md.appendMarkdown(`CDN prefix is not configured.\n\n`);
      md.appendMarkdown(
        `[$(gear) Configure CDN Prefix](command:workbench.action.openSettings?%22remoteImagePreview.cdnPrefix%22)`,
      );
      return new vscode.Hover(md, range);
    }

    const fullUrl = buildFullUrl(cdnPrefix, match.path);
    logger.info(`Hover URL: ${fullUrl}`);
    if (!fullUrl) {
      return null;
    }

    let previewUrl = fullUrl;
    const isSvg = /\.svg$/i.test(match.path);

    if (isSvg) {
      const currentColor = getSvgCurrentColor(document.uri);
      try {
        previewUrl = await svgService.getOrFetch(fullUrl, match.path, token, currentColor);
      } catch (error) {
        logger.error(
          `Failed to load SVG preview for ${match.path}: ${error}`,
        );
      }
    }

    if (token.isCancellationRequested) {
      return null;
    }

    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;
    md.supportThemeIcons = true;

    md.appendMarkdown(
      `<img src="${previewUrl}" alt="Image Preview" width="auto" height="100" />\n\n`,
    );
    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`**Path:** \`${match.path}\`  \n`);
    md.appendMarkdown(`**URL:** [${fullUrl}](${fullUrl})  \n\n`);
    md.appendMarkdown(`[$(link-external) Open in Browser](${fullUrl})`);

    return new vscode.Hover(md, range);
  }
}
