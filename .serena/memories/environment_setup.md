# Environment Setup & Configuration

## Required Environment Variables

Create a `.env.local` file in the project root with:

```bash
# Convex deployment URL (get from Convex dashboard)
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Site URL for authentication callbacks
CONVEX_SITE_URL=http://localhost:3333
```

## Initial Setup

### 1. Install Dependencies
```bash
# Using pnpm (project uses pnpm-lock.yaml)
pnpm install

# Or using npm
npm install
```

### 2. Set Up Convex
```bash
# Initialize Convex (first time only)
npx convex dev

# This will:
# - Create a Convex project
# - Generate the deployment URL
# - Set up the schema
# - Start the dev server
```

### 3. Configure Environment
Add the generated `VITE_CONVEX_URL` to `.env.local`

### 4. Start Development
```bash
npm run dev
```

This runs both:
- Web dev server on http://localhost:3333
- Convex backend with real-time sync

## IDE Configuration

### VS Code
Project includes `.vscode/` configuration (check for settings)

### Cursor
Project includes `.cursor/` configuration with custom rules:
- `.cursor/rules/convex_rules.mdc`: Convex-specific patterns

## Important Configuration Files

### TypeScript (`tsconfig.json`)
- Strict mode enabled
- Path aliases: `~/*` and `@/*` → `./src/*`
- Target: ES2022
- Module: ESNext

### Vite (`vite.config.ts`)
- React plugin: @vitejs/plugin-react
- Tailwind plugin: @tailwindcss/vite
- TSConfig paths: vite-tsconfig-paths
- Default dev port: 3333 (from src/consts.ts)

### Prettier (`.prettierrc`)
```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all"
}
```

### ESLint (`eslint.config.mjs`)
- TanStack config
- Convex plugin (recommended rules)
- Ignores: convex/_generated

### Tailwind CSS
- Version 4 with @tailwindcss/vite plugin
- No separate tailwind.config.js needed
- Configuration via CSS in src/styles/app.css

## Package Manager

Project uses **pnpm** (evidenced by pnpm-lock.yaml)

Special pnpm configuration in package.json:
```json
"pnpm": {
  "onlyBuiltDependencies": [
    "esbuild",
    "@tailwindcss/oxide"
  ]
}
```

## Development Workflow

### Typical Workflow
1. Start dev server: `npm run dev`
2. Make code changes (auto-reloads)
3. Check types: `npm run lint`
4. Format code: `npm run format`
5. Test manually in browser
6. Commit changes

### Convex Schema Changes
When modifying `convex/schema.ts`:
1. Save the file
2. Convex dev server auto-detects changes
3. Schema is automatically pushed
4. Types regenerate in `convex/_generated/`

### Adding New Convex Functions
1. Create/modify file in `convex/`
2. Use new function syntax with validators
3. Types auto-generate in `convex/_generated/api`
4. Import via `import { api } from '../convex/_generated/api'`

## Build & Deployment

### Production Build
```bash
npm run build
```

This runs:
1. `vite build` - Bundles frontend
2. `tsc --noEmit` - Type checks

Output: `.output/` directory

### Production Start
```bash
npm run start
```

Runs: `node .output/server/index.mjs`

### Convex Deployment
```bash
npx convex deploy --prod
```

Update `.env.production` with production Convex URL

## Troubleshooting

### Convex Not Syncing
```bash
# Restart Convex dev server
npx convex dev --once
```

### Type Errors After Schema Change
```bash
# Regenerate types
npx convex dev --once

# Check types
npm run lint
```

### Port 3333 Already in Use
Kill the process using port 3333 or change PORT in `src/consts.ts`

### Module Resolution Issues
```bash
# Clear caches
rm -rf node_modules .tanstack
pnpm install
```

## System Requirements

- **OS**: macOS (Darwin), Linux, or Windows
- **Node.js**: v18+ recommended
- **Package Manager**: pnpm or npm
- **Browser**: Modern browser with ES2022 support