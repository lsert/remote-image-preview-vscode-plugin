const assert = require('assert');

// Regex to match paths like /xxx/xxx/xx.(png|svg|jpg...)
// Must start with / and not be preceded by letters, numbers, @, ~, ., etc.
const IMAGE_PATH_REGEX = /(?:^|[\s"'`()\[\]{}<>,;=:])(\/(?:[a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|svg|gif|webp|ico|bmp|avif))(?=[\s"'`()\[\]{}<>,;=?#]|$)/gi;

function findImagePaths(text) {
  const matches = [];
  let match;
  IMAGE_PATH_REGEX.lastIndex = 0;
  while ((match = IMAGE_PATH_REGEX.exec(text)) !== null) {
    // match[1] is the image path
    // match.index is the start of match[0]
    // Calculate the start offset of match[1] within text
    const fullMatch = match[0];
    const path = match[1];
    const pathOffset = match.index + fullMatch.indexOf(path);
    matches.push({
      path,
      start: pathOffset,
      end: pathOffset + path.length
    });
  }
  return matches;
}

// Tests
console.log('Testing regex patterns...');

const shouldMatch = [
  { text: '"/images/logo.png"', expected: '/images/logo.png' },
  { text: "'/a/b/c.svg'", expected: '/a/b/c.svg' },
  { text: 'url(/assets/bg.png)', expected: '/assets/bg.png' },
  { text: 'var img = "/assets/pic.jpg";', expected: '/assets/pic.jpg' },
  { text: '/assets/pic.jpg?v=123', expected: '/assets/pic.jpg' },
  { text: '/only.png', expected: '/only.png' },
  { text: '<img src="/static/header.webp" />', expected: '/static/header.webp' },
  { text: '["/icons/check.svg", "/icons/cross.svg"]', expectedCount: 2 }
];

for (const item of shouldMatch) {
  const results = findImagePaths(item.text);
  if (item.expected) {
    assert.strictEqual(results.length, 1, `Failed on "${item.text}": expected 1 match, got ${results.length}`);
    assert.strictEqual(results[0].path, item.expected, `Failed on "${item.text}": expected ${item.expected}, got ${results[0].path}`);
    assert.strictEqual(item.text.slice(results[0].start, results[0].end), item.expected, `Offset incorrect for "${item.text}"`);
  } else if (item.expectedCount) {
    assert.strictEqual(results.length, item.expectedCount, `Failed on "${item.text}": expected ${item.expectedCount} matches, got ${results.length}`);
  }
}

const shouldNotMatch = [
  'https://cdn.example.com/test.png',
  'http://cdn.example.com/test.png',
  '//cdn.example.com/test.png',
  './relative/test.png',
  '../relative/test.png',
  '@/alias/test.png',
  '~/alias/test.png',
  'no-match-here.png',
  'just / not an image',
  '/not-image.pdf',
  '/not-image.html'
];

for (const text of shouldNotMatch) {
  const results = findImagePaths(text);
  assert.strictEqual(results.length, 0, `Should NOT match "${text}", but got ${JSON.stringify(results)}`);
}

console.log('All regex tests passed successfully!');
