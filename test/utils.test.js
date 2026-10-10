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

console.log('All tests passed successfully!');
