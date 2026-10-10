import * as vscode from "vscode";
import { logger } from "./logger";

export interface ImageMatch {
  path: string;
  start: number;
  end: number;
}

export const IMAGE_EXTENSIONS =
  "png|jpg|jpeg|svg|gif|webp|ico|bmp|avif";

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const START_DELIMITER = "(?:^|[\\s\"'`()\\[\\]{}<>,;=:])";
const END_DELIMITER = "(?=[\\s\"'`()\\[\\]{}<>,;=?#]|$)";

/**
 * Creates a regex to match image paths starting with the specified path prefix (default: '/').
 * Ensures the path is preceded by whitespace, quotes, or punctuation.
 */
export function createImagePathRegex(pathPrefix: string = "/"): RegExp {
  const prefix = pathPrefix.trim() || "/";
  const escaped = escapeRegex(prefix);
  return new RegExp(
    `${START_DELIMITER}(${escaped}(?:[a-zA-Z0-9_.-]+\\/)*[a-zA-Z0-9_.-]+\\.(?:${IMAGE_EXTENSIONS}))${END_DELIMITER}`,
    "gi",
  );
}

// Default regex to match absolute paths starting with '/'
export const IMAGE_PATH_REGEX = createImagePathRegex("/");

/**
 * Finds all image paths in the given text matching the configured pathPrefix.
 */
export function findImageMatches(
  text: string,
  pathPrefix: string = "/",
): ImageMatch[] {
  const matches: ImageMatch[] = [];
  const regex = createImagePathRegex(pathPrefix);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    logger.info(`Finding image matches in text: ${text}`);
    const fullMatch = match[0];
    const imagePath = match[1];
    const pathOffset = match.index + fullMatch.indexOf(imagePath);

    matches.push({
      path: imagePath,
      start: pathOffset,
      end: pathOffset + imagePath.length,
    });
  }

  return matches;
}

/**
 * Combines the CDN prefix with the matched image path.
 * Formats the prefix to ensure proper protocol and avoid duplicate slashes.
 */
export function buildFullUrl(
  cdnPrefix: string,
  imagePath: string,
): string | null {
  let prefix = cdnPrefix.trim();
  if (!prefix) {
    return null;
  }

  // Prepend https:// if protocol is omitted
  if (prefix.startsWith("//")) {
    prefix = `https:${prefix}`;
  } else if (!/^https?:\/\//i.test(prefix)) {
    prefix = `https://${prefix}`;
  }

  // Remove trailing slashes from prefix
  prefix = prefix.replace(/\/+$/, "");

  // Ensure path starts with a single slash
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

  return `${prefix}${cleanPath}`;
}

/**
 * Retrieves the CDN prefix from VS Code settings.
 */
export function getCdnPrefix(resource?: vscode.Uri): string {
  const config = vscode.workspace.getConfiguration(
    "remoteImagePreview",
    resource,
  );
  return config.get<string>("cdnPrefix", "").trim();
}

/**
 * Retrieves the path prefix from VS Code settings (default: '/').
 */
export function getPathPrefix(resource?: vscode.Uri): string {
  const config = vscode.workspace.getConfiguration(
    "remoteImagePreview",
    resource,
  );
  return config.get<string>("pathPrefix", "/").trim() || "/";
}

export interface SupportedImageLink {
  match: ImageMatch;
  fullUrl: string;
}

/**
 * Finds all supported image links in the given text and resolves their full remote URLs.
 */
export function findSupportedImageLinks(
  text: string,
  cdnPrefix: string,
  pathPrefix: string = "/",
): SupportedImageLink[] {
  if (!cdnPrefix || !cdnPrefix.trim()) {
    return [];
  }
  const matches = findImageMatches(text, pathPrefix);
  const results: SupportedImageLink[] = [];
  for (const match of matches) {
    const fullUrl = buildFullUrl(cdnPrefix, match.path);
    if (fullUrl) {
      results.push({ match, fullUrl });
    }
  }
  return results;
}

/**
 * Checks whether link underlining is enabled in VS Code settings.
 */
export function isUnderlineEnabled(resource?: vscode.Uri): boolean {
  const config = vscode.workspace.getConfiguration(
    "remoteImagePreview",
    resource,
  );
  return config.get<boolean>("underline", true);
}

/**
 * Retrieves the gutter icon size from VS Code settings (default: 'cover').
 */
export function getGutterIconSize(resource?: vscode.Uri): string {
  const config = vscode.workspace.getConfiguration(
    "remoteImagePreview",
    resource,
  );
  return config.get<string>("gutterIconSize", "cover").trim() || "cover";
}

/**
 * Retrieves the SVG currentColor replacement from VS Code settings (default: '#ffffff').
 */
export function getSvgCurrentColor(resource?: vscode.Uri): string {
  const config = vscode.workspace.getConfiguration(
    "remoteImagePreview",
    resource,
  );
  return config.get<string>("svgCurrentColor", "#ffffff").trim() || "#ffffff";
}
