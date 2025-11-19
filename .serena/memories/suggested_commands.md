# Suggested Commands

## Development Commands

### Starting Development
```bash
# Start both Convex backend and web dev server (recommended)
npm run dev

# Start only web dev server (port 3333)
npm run dev:web

# Start only Convex backend
npm run dev:convex

# Watch TypeScript compilation
npm run dev:ts
```

### Building & Production
```bash
# Build for production (includes type checking)
npm run build

# Start production server
npm run start
```

### Code Quality
```bash
# Type checking and linting
npm run lint

# Format code with Prettier
npm run format
```

## Convex Commands
```bash
# Initialize/sync Convex (run from project root)
npx convex dev

# Deploy to production
npx convex deploy

# View Convex dashboard
npx convex dashboard
```

## Common Git Commands (macOS/Darwin)
```bash
# Standard git commands work on Darwin
git status
git add .
git commit -m "message"
git push
git pull
```

## File System Commands (macOS/Darwin)
```bash
# Standard Unix commands
ls -la          # list files
find . -name    # find files
grep -r         # search in files
cat             # read files
cd              # change directory
```

## Package Management
The project uses npm (package-lock.json would be present) or pnpm (pnpm-lock.yaml is present).
```bash
# Install dependencies
npm install
# or
pnpm install

# Add new dependency
npm install <package>
pnpm add <package>
```

## Development Server Details
- Web dev server runs on port 3333 (configured in src/consts.ts)
- Hot module replacement (HMR) enabled via Vite
- Convex provides real-time data sync in development