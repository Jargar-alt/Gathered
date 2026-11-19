#!/usr/bin/env node
/**
 * Bumps store build identifiers in version.json before an EAS upload.
 *
 * Why: EAS `autoIncrement` does not work with app.config.js + local versioning.
 * Remote versioning kept drifting vs App Store Connect / Play. This file is the
 * single source of truth and is bumped on every production build command.
 *
 * Usage:
 *   node scripts/bump-build.js ios
 *   node scripts/bump-build.js android
 *   node scripts/bump-build.js both
 *   node scripts/bump-build.js marketing   # 1.1.1 -> 1.1.2 (new App Store train)
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'version.json');
const target = (process.argv[2] || '').toLowerCase();

if (!['ios', 'android', 'both', 'marketing'].includes(target)) {
  console.error('Usage: node scripts/bump-build.js <ios|android|both|marketing>');
  process.exit(1);
}

const raw = fs.readFileSync(file, 'utf8');
const v = JSON.parse(raw);

if (target === 'marketing') {
  const parts = String(v.version)
    .split('.')
    .map((n) => parseInt(n, 10));
  while (parts.length < 3) parts.push(0);
  parts[2] += 1; // patch bump
  v.version = parts.join('.');
  // New marketing train: keep build numbers monotonically increasing (Apple-safe).
  v.iosBuildNumber = Number(v.iosBuildNumber) + 1;
  console.log(`Marketing version -> ${v.version} (ios build ${v.iosBuildNumber})`);
} else {
  if (target === 'ios' || target === 'both') {
    v.iosBuildNumber = Number(v.iosBuildNumber) + 1;
  }
  if (target === 'android' || target === 'both') {
    v.androidVersionCode = Number(v.androidVersionCode) + 1;
  }
  console.log(
    `Build bump -> version ${v.version} | ios ${v.iosBuildNumber} | android ${v.androidVersionCode}`
  );
}

fs.writeFileSync(file, `${JSON.stringify(v, null, 2)}\n`);
