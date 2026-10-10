const assert = require('assert');
const Module = require('module');

const origRequire = Module.prototype.require;
let createdChannels = [];

Module.prototype.require = function (modulePath) {
  if (modulePath === 'vscode') {
    return {
      window: {
        createOutputChannel: (name, options) => {
          const channel = {
            name,
            options,
            logs: {
              trace: [],
              debug: [],
              info: [],
              warn: [],
              error: []
            },
            shown: false,
            preserveFocus: undefined,
            disposed: false,
            trace(msg, ...args) {
              this.logs.trace.push({ msg, args });
            },
            debug(msg, ...args) {
              this.logs.debug.push({ msg, args });
            },
            info(msg, ...args) {
              this.logs.info.push({ msg, args });
            },
            warn(msg, ...args) {
              this.logs.warn.push({ msg, args });
            },
            error(err, ...args) {
              this.logs.error.push({ err, args });
            },
            show(preserveFocus) {
              this.shown = true;
              this.preserveFocus = preserveFocus;
            },
            dispose() {
              this.disposed = true;
            }
          };
          createdChannels.push(channel);
          return channel;
        }
      }
    };
  }
  return origRequire.apply(this, arguments);
};

const { Logger, logger } = require('../out/logger');

console.log('Testing Logger module...');

// 1. Test lazy initialization
assert.strictEqual(
  createdChannels.length,
  0,
  'Channel should not be created before any method is called'
);

// 2. Test default logger instance and methods
logger.info('Hello world', { foo: 'bar' });
assert.strictEqual(createdChannels.length, 1, 'Channel created on first call');
assert.strictEqual(createdChannels[0].name, 'Remote Image Preview');
assert.deepStrictEqual(createdChannels[0].options, { log: true });
assert.strictEqual(createdChannels[0].logs.info.length, 1);
assert.strictEqual(createdChannels[0].logs.info[0].msg, 'Hello world');
assert.deepStrictEqual(createdChannels[0].logs.info[0].args, [{ foo: 'bar' }]);

logger.debug('Debug message', 123);
assert.strictEqual(createdChannels[0].logs.debug.length, 1);
assert.strictEqual(createdChannels[0].logs.debug[0].msg, 'Debug message');

logger.trace('Trace message');
assert.strictEqual(createdChannels[0].logs.trace.length, 1);

logger.warn('Warning message');
assert.strictEqual(createdChannels[0].logs.warn.length, 1);

logger.error(new Error('Sample error'));
assert.strictEqual(createdChannels[0].logs.error.length, 1);
assert.ok(createdChannels[0].logs.error[0].err instanceof Error);

// 3. Test show()
logger.show(true);
assert.strictEqual(createdChannels[0].shown, true);
assert.strictEqual(createdChannels[0].preserveFocus, true);

// 4. Test dispose()
logger.dispose();
assert.strictEqual(createdChannels[0].disposed, true);

// 5. Test custom channel name
const customLogger = new Logger('Custom Test Logger');
customLogger.info('Testing custom logger');
assert.strictEqual(createdChannels.length, 2);
assert.strictEqual(createdChannels[1].name, 'Custom Test Logger');

console.log('All Logger tests passed successfully!');
