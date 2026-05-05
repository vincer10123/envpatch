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

Use programmatically in your project:

```js
const { diff, merge } = require('envpatch');

const changes = diff('.env', '.env.production');
console.log(changes);
// { added: ['NEW_KEY'], removed: ['OLD_KEY'], changed: ['API_URL'] }

merge('.env.staging', '.env.production', { output: '.env.merged' });
```

> **Note:** `envpatch` never overwrites secret values without confirmation. Use `--force` to skip prompts.

---

## Options

| Flag | Description |
|------|-------------|
| `--output` | Path for the merged output file |
| `--force` | Skip confirmation prompts |
| `--silent` | Suppress output logs |

---

## Contributing

Pull requests are welcome. Please open an issue first to discuss any major changes.

---

## License

[MIT](LICENSE)