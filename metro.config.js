const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ── Reduce memory usage ───────────────────────────────────────────────────────
// Use only 1 worker to avoid out-of-memory crashes on low-RAM machines.
// Metro defaults to (CPU count - 1) workers which is too many here.
config.maxWorkers = 1;

// Increase the transformer memory limit
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: { keep_classnames: true, keep_fnames: true },
  },
};

module.exports = config;
