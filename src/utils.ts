import * as vscode from 'vscode';

export interface ImageMatch {
  path: string;
  start: number;
  end: number;
}

// Regex to match absolute paths ending with common image extensions.
// Ensures the path starts with a single slash '/' and is preceded by whitespace, quotes, or punctuation.
export const IMAGE_PATH_REGEX =
  /(?:^|[\s"'`()\[\]{}<>,;=:])(\/(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|svg|gif|webp|ico|bmp|avif))(?=[\s"'`()\[\]{}<>,;=?#]|$)/gi;

/**
 * Finds all image paths in the given text.
 */
export function findImageMatches(text: string): ImageMatch[] {
  const matches: ImageMatch[] = [];
  let match: RegExpExecArray | null;
  IMAGE_PATH_REGEX.lastIndex = 0;

  while ((match = IMAGE_PATH_REGEX.exec(text)) !== null) {
    const fullMatch = match[0];
    const imagePath = match[1];
    const pathOffset = match.index + fullMatch.indexOf(imagePath);

    matches.push({
      path: imagePath,
      start: pathOffset,
      end: pathOffset + imagePath.length
    });
  }

  return matches;
}

/**
 * Combines the CDN prefix with the matched image path.
 * Formats the prefix to ensure proper protocol and avoid duplicate slashes.
 */
export function buildFullUrl(cdnPrefix: string, imagePath: string): string | null {
  let prefix = cdnPrefix.trim();
  if (!prefix) {
    return null;
  }

  // Prepend https:// if protocol is omitted
  if (prefix.startsWith('//')) {
    prefix = `https:${prefix}`;
  } else if (!/^https?:\/\//i.test(prefix)) {
    prefix = `https://${prefix}`;
  }

  // Remove trailing slashes from prefix
  prefix = prefix.replace(/\/+$/, '');

  // Ensure path starts with a single slash
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  return `${prefix}${cleanPath}`;
}

/**
 * Retrieves the CDN prefix from VS Code settings.
 */
export function getCdnPrefix(resource?: vscode.Uri): string {
  const config = vscode.workspace.getConfiguration('remoteImagePreview', resource);
  return config.get<string>('cdnPrefix', '').trim();
}
