// Pure-CLI npm publishing. No browser is involved at publish time.
// Auth comes from ~/.npmrc (npm login) or NODE_AUTH_TOKEN / NPM_TOKEN env var.
// Usage: node scripts/publish-npm.mjs [--dry-run]
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(readFileSync(root + 'package.json', 'utf8'));
const dry = process.argv.includes('--dry-run');

const run = (bin, args, opts = {}) => {
  console.log(`\n$ ${bin} ${args.join(' ')}`);
  // stdio: 'inherit' returns null, so never call .toString() on the result.
  execFileSync(bin, args, { cwd: root, stdio: 'inherit', shell: true, ...opts });
};

console.log(`Publishing ${pkg.name}@${pkg.version} (pure CLI)`);

// 1. Verify auth without printing any credential.
try {
  const whoami = execFileSync('npm', ['whoami'], { cwd: root, encoding: 'utf8', shell: true }).trim();
  console.log(`Authenticated as ${whoami}`);
} catch {
  console.error('\nNot logged in. Set up credentials ONCE, then publishing stays pure CLI:');
  console.error('  npm login --auth-type=web        # one-time browser authorization');
  console.error('  # or: export NODE_AUTH_TOKEN=<your npm automation token>');
  process.exit(1);
}

// 2. Release checks.
run('node', ['scripts/verify.mjs']);
run('npm', ['pack', '--dry-run']);

if (dry) {
  console.log('\n--dry-run: skipping publish.');
  process.exit(0);
}

// 3. Publish.
run('npm', ['publish', '--access', 'public']);
console.log(`\nPublished: https://www.npmjs.com/package/${pkg.name}/v/${pkg.version}`);
