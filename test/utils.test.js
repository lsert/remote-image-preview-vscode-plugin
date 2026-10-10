const assert = require('assert');

// Test the logic directly
const IMAGE_PATH_REGEX =
  /(?:^|[\s"'`()\[\]{}<>,;=:])(\/(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|svg|gif|webp|ico|bmp|avif))(?=[\s"'`()\[\]{}<>,;=?#]|$)/gi;

function findImageMatches(text) {
  const matches = [];
  let match;
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

function buildFullUrl(cdnPrefix, imagePath) {
  let prefix = cdnPrefix.trim();
  if (!prefix) {
    return null;
  }

  if (prefix.startsWith('//')) {
    prefix = `https:${prefix}`;
  } else if (!/^https?:\/\//i.test(prefix)) {
    prefix = `https://${prefix}`;
  }

  prefix = prefix.replace(/\/+$/, '');
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  return `${prefix}${cleanPath}`;
}

// 1. Test buildFullUrl with various prefixes
console.log('Testing buildFullUrl...');

assert.strictEqual(
  buildFullUrl('https://cdn.example.com', '/images/banner.png'),
  'https://cdn.example.com/images/banner.png'
);

assert.strictEqual(
  buildFullUrl('https://cdn.example.com/', '/images/banner.png'),
  'https://cdn.example.com/images/banner.png'
);

assert.strictEqual(
  buildFullUrl('http://my-host.com:8080/static/', '/logo.svg'),
  'http://my-host.com:8080/static/logo.svg'
);

assert.strictEqual(
  buildFullUrl('//cdn.example.com', '/logo.svg'),
  'https://cdn.example.com/logo.svg'
);

assert.strictEqual(
  buildFullUrl('cdn.example.com', '/logo.svg'),
  'https://cdn.example.com/logo.svg'
);

assert.strictEqual(buildFullUrl('', '/logo.svg'), null);
assert.strictEqual(buildFullUrl('   ', '/logo.svg'), null);

// 2. Test findImageMatches in various contexts
console.log('Testing findImageMatches...');

const testCases = [
  {
    input: 'const a = "/static/img/hero.png"; const b = \'/icons/arrow.svg\';',
    expected: ['/static/img/hero.png', '/icons/arrow.svg']
  },
  {
    input: '<img src="/assets/cover.jpg" alt="test" />',
    expected: ['/assets/cover.jpg']
  },
  {
    input: 'background: url(/bg/dark-theme.png);',
    expected: ['/bg/dark-theme.png']
  },
  {
    input: 'url: "/api/preview.gif?cache=false"',
    expected: ['/api/preview.gif']
  },
  {
    input: 'import { foo } from "@/components/test.png";',
    expected: [] // should NOT match alias with @
  },
  {
    input: 'const path = "./relative/image.png";',
    expected: [] // should NOT match relative path
  },
  {
    input: 'const full = "https://external.com/avatar.png";',
    expected: [] // should NOT match full external URL
  }
];

for (const tc of testCases) {
  const matches = findImageMatches(tc.input);
  const paths = matches.map((m) => m.path);
  assert.deepStrictEqual(
    paths,
    tc.expected,
    `Failed for input: ${tc.input}. Got ${JSON.stringify(paths)}`
  );
}

// 3. Test findSupportedImageLinks (used for underline decorations)
console.log('Testing findSupportedImageLinks for underline ranges...');

function findSupportedImageLinks(text, cdnPrefix) {
  if (!cdnPrefix || !cdnPrefix.trim()) {
    return [];
  }
  const matches = findImageMatches(text);
  const results = [];
  for (const match of matches) {
    const fullUrl = buildFullUrl(cdnPrefix, match.path);
    if (fullUrl) {
      results.push({ match, fullUrl });
    }
  }
  return results;
}

// 3.1 When CDN is not configured, no links should be supported (no underlines)
assert.deepStrictEqual(
  findSupportedImageLinks('const a = "/static/logo.png";', ''),
  []
);
assert.deepStrictEqual(
  findSupportedImageLinks('const a = "/static/logo.png";', '   '),
  []
);

// 3.2 When CDN is configured, supported links should have exact start/end for underlines
const cdn = 'https://cdn.example.com';
const codeLine = 'const a = "/static/img/hero.png"; const b = \'/icons/arrow.svg\';';
const supported = findSupportedImageLinks(codeLine, cdn);

assert.strictEqual(supported.length, 2);

// Check first link underline range
assert.strictEqual(supported[0].match.path, '/static/img/hero.png');
assert.strictEqual(supported[0].fullUrl, 'https://cdn.example.com/static/img/hero.png');
assert.strictEqual(
  codeLine.slice(supported[0].match.start, supported[0].match.end),
  '/static/img/hero.png'
);

// Check second link underline range
assert.strictEqual(supported[1].match.path, '/icons/arrow.svg');
assert.strictEqual(supported[1].fullUrl, 'https://cdn.example.com/icons/arrow.svg');
assert.strictEqual(
  codeLine.slice(supported[1].match.start, supported[1].match.end),
  '/icons/arrow.svg'
);

// 3.3 Non-supported paths should yield no underline ranges
const ignoredLine = 'const a = "./relative.png"; const b = "@/alias.png"; const c = "https://ext.com/img.png";';
assert.deepStrictEqual(findSupportedImageLinks(ignoredLine, cdn), []);

console.log('All tests passed successfully!');
