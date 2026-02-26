const config = require('../config/config');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

const levelNames = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG',
};

const levelColors = {
  0: colors.red,
  1: colors.yellow,
  2: colors.green,
  3: colors.blue,
};

class Logger {
  constructor(level = config.log.level) {
    this.level = levels[level] || levels.info;
  }

  log(levelNum, message, meta = {}) {
    if (levelNum > this.level) return;

    const timestamp = new Date().toISOString();
    const color = levelColors[levelNum];
    const levelName = levelNames[levelNum];

    const logMessage = `${timestamp} [${color}${levelName}${colors.reset}] ${message}`;
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';

    console.log(`${logMessage}${metaStr}`);
  }

  error(message, meta) {
    this.log(levels.error, message, meta);
  }

  warn(message, meta) {
    this.log(levels.warn, message, meta);
  }

  info(message, meta) {
    this.log(levels.info, message, meta);
  }

  debug(message, meta) {
    this.log(levels.debug, message, meta);
  }
}

module.exports = new Logger(config.log.level);
