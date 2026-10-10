import * as vscode from "vscode";
import * as http from "http";
import * as https from "https";

export interface SvgDimensions {
  width: number;
  height: number;
}

export function parseSvgDimensions(svgText: string): SvgDimensions | null {
  // Check viewBox: viewBox="min-x min-y width height"
  const viewBoxMatch = svgText.match(
    /viewBox\s*=\s*["']\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i,
  );
  if (viewBoxMatch) {
    const width = parseFloat(viewBoxMatch[1]);
    const height = parseFloat(viewBoxMatch[2]);
    if (width > 0 && height > 0) {
      return { width, height };
    }
  }

  // Check width and height attributes in <svg ...>
  const svgTagMatch = svgText.match(/<svg\b[^>]*>/i);
  if (svgTagMatch) {
    const widthMatch = svgTagMatch[0].match(
      /\bwidth\s*=\s*["']([\d.]+)(px)?["']/i,
    );
    const heightMatch = svgTagMatch[0].match(
      /\bheight\s*=\s*["']([\d.]+)(px)?["']/i,
    );
    if (widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1]);
      const height = parseFloat(heightMatch[1]);
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }
  }

  return null;
}

/**
 * Normalizes SVG text to ensure it has a viewBox for proper scaling in the gutter and hover,
 * and sets currentColor to the configured color (defaults to '#ffffff') so monochrome icons are visible.
 */
export function normalizeSvg(
  svgText: string,
  currentColor = "#ffffff",
): string {
  const color = currentColor.trim() || "#ffffff";

  // Replace all occurrences of currentColor with the configured color
  svgText = svgText.replace(/\bcurrentColor\b/gi, color);

  // Ensure root <svg> has color="color" if no color attribute is specified
  if (!/<svg\b[^>]*\bcolor\s*=/i.test(svgText)) {
    svgText = svgText.replace(/<svg\b([^>]*)>/i, `<svg$1 color="${color}">`);
  }

  if (!/\bviewBox\s*=/i.test(svgText)) {
    const dim = parseSvgDimensions(svgText);
    if (dim) {
      svgText = svgText.replace(
        /<svg\b([^>]*)>/i,
        `<svg$1 viewBox="0 0 ${dim.width} ${dim.height}">`,
      );
    }
  }
  return svgText;
}

export class SvgCacheService {
  private cache = new Map<string, string>(); // cacheKey -> dataUri
  private inFlight = new Map<string, Promise<string>>();
  private maxCacheSize = 300;

  private getCacheKey(imagePath: string, currentColor?: string): string {
    const color = currentColor?.trim() || "#ffffff";
    return `${imagePath}::${color}`;
  }

  public get(imagePath: string, currentColor?: string): string | undefined {
    return this.cache.get(this.getCacheKey(imagePath, currentColor));
  }

  public has(imagePath: string, currentColor?: string): boolean {
    return this.cache.has(this.getCacheKey(imagePath, currentColor));
  }

  public set(imagePath: string, dataUri: string, currentColor?: string): void {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(this.getCacheKey(imagePath, currentColor), dataUri);
  }

  public async getOrFetch(
    fullUrl: string,
    imagePath: string,
    token?: vscode.CancellationToken,
    currentColor?: string,
  ): Promise<string> {
    const cacheKey = this.getCacheKey(imagePath, currentColor);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let pending = this.inFlight.get(cacheKey);
    if (!pending) {
      const color = currentColor?.trim() || "#ffffff";
      pending = this.fetchAndConvert(fullUrl, token, color)
        .then((dataUri) => {
          this.set(imagePath, dataUri, color);
          this.inFlight.delete(cacheKey);
          return dataUri;
        })
        .catch((err) => {
          this.inFlight.delete(cacheKey);
          throw err;
        });
      this.inFlight.set(cacheKey, pending);
    }

    return pending;
  }

  public clearCache(): void {
    this.cache.clear();
    this.inFlight.clear();
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  private async fetchAndConvert(
    url: string,
    token?: vscode.CancellationToken,
    currentColor = "#ffffff",
  ): Promise<string> {
    const buffer = await this.fetchBuffer(url, token);
    const rawSvg = buffer.toString("utf-8");
    const normalizedSvg = normalizeSvg(rawSvg, currentColor);
    const base64 = Buffer.from(normalizedSvg, "utf-8").toString("base64");
    return `data:image/svg+xml;base64,${base64}`;
  }

  private async fetchBuffer(
    url: string,
    token?: vscode.CancellationToken,
    timeoutMs = 6000,
  ): Promise<Buffer> {
    if (typeof (globalThis as any).fetch === "function") {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const tokenListener = token?.onCancellationRequested(() =>
        controller.abort(),
      );

      try {
        const response = await (globalThis as any).fetch(url, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } finally {
        clearTimeout(timeoutId);
        tokenListener?.dispose();
      }
    }

    return new Promise<Buffer>((resolve, reject) => {
      const client = url.startsWith("https:") ? https : http;
      const req = client.get(url, { timeout: timeoutMs }, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const redirectUrl = new URL(res.headers.location, url).toString();
          resolve(this.fetchBuffer(redirectUrl, token, timeoutMs));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
        );
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      });

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timed out"));
      });

      const tokenListener = token?.onCancellationRequested(() => {
        req.destroy();
        reject(new Error("Request cancelled"));
      });
      req.on("close", () => tokenListener?.dispose());
    });
  }
}

export const svgService = new SvgCacheService();
