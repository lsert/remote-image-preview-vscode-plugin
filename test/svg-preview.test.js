const assert = require('assert');

console.log('Testing SVG Base64 Conversion and Path-Keyed Caching...');

// 1. Test Base64 URI generation
function bufferToSvgDataUri(buffer) {
  const base64 = buffer.toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

const sampleSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle r="5"/></svg>';
const sampleBuffer = Buffer.from(sampleSvg, 'utf-8');
const dataUri = bufferToSvgDataUri(sampleBuffer);

assert.ok(dataUri.startsWith('data:image/svg+xml;base64,'));
const decoded = Buffer.from(dataUri.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf-8');
assert.strictEqual(decoded, sampleSvg);
console.log('✓ SVG Base64 data URI format verified');

// 2. Test SVG Extension Detection
function isSvgPath(path) {
  return /\.svg$/i.test(path);
}

assert.strictEqual(isSvgPath('/icons/mono/test.svg'), true);
assert.strictEqual(isSvgPath('/ICONS/MONO/TEST.SVG'), true);
assert.strictEqual(isSvgPath('/images/hero.png'), false);
assert.strictEqual(isSvgPath('/images/pic.jpg'), false);
assert.strictEqual(isSvgPath('/images/anim.gif'), false);
console.log('✓ SVG extension detection verified');

// 3. Test Path-Keyed Caching Simulation
class SvgCacheManager {
  constructor(maxSize = 3) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(path) {
    return this.cache.get(path);
  }

  set(path, dataUri) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(path, dataUri);
  }

  has(path) {
    return this.cache.has(path);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

const cache = new SvgCacheManager(3);
const path1 = '/icons/icon1.svg';
const path2 = '/icons/icon2.svg';
const path3 = '/icons/icon3.svg';
const path4 = '/icons/icon4.svg';

cache.set(path1, 'data:svg1');
cache.set(path2, 'data:svg2');

assert.strictEqual(cache.has(path1), true);
assert.strictEqual(cache.get(path1), 'data:svg1');
assert.strictEqual(cache.has('/icons/non-existent.svg'), false);

// Test eviction when exceeding maxSize (3)
cache.set(path3, 'data:svg3');
assert.strictEqual(cache.size(), 3);

cache.set(path4, 'data:svg4');
// path1 should be evicted (first-in first-out)
assert.strictEqual(cache.size(), 3);
assert.strictEqual(cache.has(path1), false);
assert.strictEqual(cache.has(path2), true);
assert.strictEqual(cache.has(path3), true);
assert.strictEqual(cache.has(path4), true);

cache.clear();
assert.strictEqual(cache.size(), 0);
console.log('✓ Image path-keyed caching and eviction verified');

// 4. Test SVG Normalization for Gutter Scaling and currentColor
function normalizeSvg(svgText, currentColor = '#ffffff') {
  const color = currentColor.trim() || '#ffffff';
  // Replace all occurrences of currentColor with configured color
  svgText = svgText.replace(/\bcurrentColor\b/gi, color);

  // Ensure root <svg> has color attribute if not specified
  if (!/<svg\b[^>]*\bcolor\s*=/i.test(svgText)) {
    svgText = svgText.replace(/<svg\b([^>]*)>/i, `<svg$1 color="${color}">`);
  }

  if (!/\bviewBox\s*=/i.test(svgText)) {
    const widthMatch = svgText.match(/<svg\b[^>]*\bwidth\s*=\s*["']([\d.]+)(px)?["']/i);
    const heightMatch = svgText.match(/<svg\b[^>]*\bheight\s*=\s*["']([\d.]+)(px)?["']/i);
    if (widthMatch && heightMatch) {
      const w = parseFloat(widthMatch[1]);
      const h = parseFloat(heightMatch[1]);
      if (w > 0 && h > 0) {
        svgText = svgText.replace(
          /<svg\b([^>]*)>/i,
          `<svg$1 viewBox="0 0 ${w} ${h}">`
        );
      }
    }
  }
  return svgText;
}

const unscaledSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M0 0h32v32H0z"/></svg>';
const normalized = normalizeSvg(unscaledSvg);
assert.ok(normalized.includes('viewBox="0 0 32 32"'));
assert.ok(normalized.includes('color="#ffffff"'));

const currentColorSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" stroke="currentColor"/></svg>';
const normalizedDefaultColor = normalizeSvg(currentColorSvg);
assert.ok(normalizedDefaultColor.includes('fill="#ffffff"'));
assert.ok(normalizedDefaultColor.includes('stroke="#ffffff"'));
assert.ok(!normalizedDefaultColor.includes('currentColor'));

const normalizedCustomColor = normalizeSvg(currentColorSvg, '#ff8800');
assert.ok(normalizedCustomColor.includes('fill="#ff8800"'));
assert.ok(normalizedCustomColor.includes('stroke="#ff8800"'));
assert.ok(normalizedCustomColor.includes('color="#ff8800"'));
console.log('✓ SVG normalization (viewBox injection & configurable currentColor) verified');

console.log('All SVG preview and caching tests passed successfully!');

