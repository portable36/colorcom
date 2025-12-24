#!/usr/bin/env node
const {execSync} = require('child_process');
const {readdirSync, statSync} = require('fs');
const {join} = require('path');

function findPackageJsons(dir) {
  const results = [];
  const entries = readdirSync(dir);
  for (const e of entries) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) {
      // if package.json in this dir
      try {
        const pkg = require(join(full, 'package.json'));
        if (pkg) results.push({dir: full, pkg});
      } catch (err) {
        // continue recursion
        results.push(...findPackageJsons(full));
      }
    }
  }
  return results;
}

const root = process.cwd();
const packages = findPackageJsons(join(root, 'microservices'));
console.log('Discovered packages:', packages.map(p => p.dir));

let failed = false;

for (const p of packages) {
  const dir = p.dir;
  const pkg = p.pkg;
  try {
    if (pkg.scripts && pkg.scripts.test) {
      console.log('\n==> Running tests in', dir);
      try {
        execSync('npm ci --no-audit --no-fund', {cwd: dir, stdio: 'inherit'});
      } catch (e) {
        console.warn('npm ci failed, falling back to npm install for', dir);
        execSync('npm install --no-audit --no-fund --legacy-peer-deps', {cwd: dir, stdio: 'inherit'});
      }
      execSync('npm test --silent -- --passWithNoTests', {cwd: dir, stdio: 'inherit'});
    } else if (pkg.scripts && pkg.scripts.build) {
      console.log('\n==> Running build in', dir);
      try {
        execSync('npm ci --no-audit --no-fund', {cwd: dir, stdio: 'inherit'});
      } catch (e) {
        console.warn('npm ci failed, falling back to npm install for', dir);
        execSync('npm install --no-audit --no-fund --legacy-peer-deps', {cwd: dir, stdio: 'inherit'});
      }
      execSync('npm run build --silent', {cwd: dir, stdio: 'inherit'});
    } else {
      console.log('\n==> Skipping', dir, '(no test/build script)');
    }
  } catch (err) {
    console.error('\n==> Error in', dir, '\n', err.message);
    failed = true;
  }
}

if (failed) {
  console.error('\nOne or more checks failed');
  process.exit(2);
}

console.log('\nAll checks passed');
