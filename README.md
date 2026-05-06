# envpatch

> Utility to diff and merge `.env` files across environments safely

---

## Installation

```bash
npm install -g envpatch
# or use locally
npm install --save-dev envpatch
```

---

## Usage

Compare two `.env` files and see what's different:

```bash
npx envpatch diff .env .env.production
```

Merge changes from one environment file into another:

```bash
npx envpatch merge .env.staging .env.production --output .env.merged
```

Validate that all required keys are present in an env file:

```bash
npx envpatch validate .env --required .env.example
```

Strip keys from an env file that aren't present in a reference file:

```bash
npx envpatch strip .env --reference .env.example --output .env.clean
```

Use programmatically in your project:

```js
const { diff, merge, validate, strip } = require('envpatch');

const changes = diff('.env', '.env.production');
console.log(changes);
// { added: ['NEW_KEY'], removed: ['OLD_KEY'], changed: ['API_URL'] }

merge('.env.staging', '.env.production', { output: '.env.merged' });

// Check that all keys from .env.example exist in .env
const result = validate('.env', { required: '.env.example' });
console.log(result);
// { valid: false, missing: ['STRIPE_KEY', 'SENTRY_DSN'] }

// Remove keys not present in .env.example
strip('.env', { reference: '.env.example', output: '.env.clean' });
```

> **Note:** `envpatch` never overwrites secret values without confirmation. Use `--force` to skip prompts.

---

## Options

| Flag | Description |
|------|-------------|
| `--output` | Path for the merged output file |
| `--force` | Skip confirmation prompts |
| `--silent` | Suppress output logs |
| `--required` | Path to a file whose keys are treated as required |
| `--reference` | Path to a file used as the reference keyset for `strip` |

---

## Contributing

Pull requests are welcome. Please open an issue first to discuss any major changes.

---

## License

[MIT](LICENSE)
