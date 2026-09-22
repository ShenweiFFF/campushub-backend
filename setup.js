// setup.js — automates the rest of Part 1 for CampusHub backend
// Run this from inside the campushub-backend folder: node setup.js

const fs = require('fs');
const { execSync } = require('child_process');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

// Sanity check: must be run from the project root
if (!fs.existsSync('package.json')) {
  console.error('Error: package.json not found. Run this from inside campushub-backend/.');
  process.exit(1);
}

// 1. Create the 3-tier architecture folders
['src', 'src/routes', 'src/controllers', 'src/services', 'src/models'].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Created ${dir}/`);
});

// 2. Write a clean tsconfig.json (overwrites the auto-generated one from tsc --init)
const tsconfig = {
  compilerOptions: {
    target: 'ES2020',
    module: 'commonjs',
    rootDir: './src',
    outDir: './dist',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist'],
};
fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2) + '\n');
console.log('Wrote tsconfig.json');

// 3. Update package.json scripts (dev/build), keep everything else as-is
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = { ...pkg.scripts, dev: 'ts-node src/app.ts', build: 'tsc' };
delete pkg.scripts.test;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Updated package.json scripts');

// 4. .gitignore
fs.writeFileSync('.gitignore', 'node_modules/\ndist/\n.env\n');
console.log('Wrote .gitignore');

// 5. .env-example
fs.writeFileSync('.env-example', 'PORT=3000\n');
console.log('Wrote .env-example');

// 6. Commit
try {
  run('git add .');
  run('git commit -m "Initial project scaffold"');
  console.log('\nDone! Part 1 scaffold committed.');
} catch (err) {
  console.error(
    '\nGit commit failed. If it complains about missing identity, run:\n' +
      '  git config --global user.email "you@example.com"\n' +
      '  git config --global user.name "Your Name"\n' +
      'then re-run: git add . && git commit -m "Initial project scaffold"'
  );
}
