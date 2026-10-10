const assert = require('assert');

const IMAGE_EXTENSIONS = 'png|jpg|jpeg|svg|gif|webp|ico|bmp|avif';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const START_DELIMITER = "(?:^|[\\s\"'`()\\[\\]{}<>,;=:])";
const END_DELIMITER = "(?=[\\s\"'`()\\[\\]{}<>,;=?#]|$)";

function createImagePathRegex(pathPrefix = '/') {
  const prefix = pathPrefix.trim() || '/';
  const escaped = escapeRegex(prefix);
  return new RegExp(
    `${START_DELIMITER}(${escaped}(?:[a-zA-Z0-9_.-]+\\/)*[a-zA-Z0-9_.-]+\\.(?:${IMAGE_EXTENSIONS}))${END_DELIMITER}`,
    'gi'
  );
}

function findImageMatches(text, pathPrefix = '/') {
  const matches = [];
  const regex = createImagePathRegex(pathPrefix);
  let match;

  while ((match = regex.exec(text)) !== null) {
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

// 2. Test findImageMatches with default pathPrefix '/'
console.log('Testing findImageMatches with default pathPrefix...');

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
    expected: [] // should NOT match alias with @ when pathPrefix is '/'
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

// 2.1 Test findImageMatches with custom pathPrefix
console.log('Testing findImageMatches with custom pathPrefix...');

const customPrefixCases = [
  {
    input: 'const a = "/static/img/hero.png"; const b = "/other/pic.png";',
    prefix: '/static/',
    expected: ['/static/img/hero.png']
  },
  {
    input: 'const a = "@/assets/logo.svg"; const b = "/static/logo.svg";',
    prefix: '@/',
    expected: ['@/assets/logo.svg']
  }
];

for (const tc of customPrefixCases) {
  const matches = findImageMatches(tc.input, tc.prefix);
  const paths = matches.map((m) => m.path);
  assert.deepStrictEqual(
    paths,
    tc.expected,
    `Failed for custom prefix ${tc.prefix} on input: ${tc.input}`
  );
}

// 3. Test findSupportedImageLinks (used for underline decorations)
console.log('Testing findSupportedImageLinks for underline ranges...');

function findSupportedImageLinks(text, cdnPrefix, pathPrefix = '/') {
  if (!cdnPrefix || !cdnPrefix.trim()) {
    return [];
  }
  const matches = findImageMatches(text, pathPrefix);
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

// 3.3 Custom pathPrefix in findSupportedImageLinks
const customSupported = findSupportedImageLinks(
  'const a = "/static/img/hero.png"; const b = "/other/pic.png";',
  cdn,
  '/static/'
);
assert.strictEqual(customSupported.length, 1);
assert.strictEqual(customSupported[0].match.path, '/static/img/hero.png');

console.log('All tests passed successfully!');
