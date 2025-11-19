# Codebase Structure

## Root Directory
```
yoga-training-app/
├── .cursor/              # Cursor IDE configuration
├── .serena/              # Serena memory files
├── .tanstack/            # TanStack generated files
├── .vscode/              # VS Code configuration
├── convex/               # Backend code (Convex)
├── public/               # Static assets
├── src/                  # Frontend source code
├── node_modules/         # Dependencies
├── CLAUDE.md            # Project instructions for Claude Code
├── components.json      # Shadcn/UI configuration
├── eslint.config.mjs    # ESLint configuration
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── pnpm-lock.yaml       # Lock file (using pnpm)
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
├── .env.local           # Environment variables (not in git)
├── .prettierrc          # Prettier configuration
└── .prettierignore      # Prettier ignore patterns
```

## Convex Directory (`convex/`)
Backend serverless functions and database schema:

```
convex/
├── _generated/          # Auto-generated Convex types (DO NOT EDIT)
├── auth.ts              # Authentication setup
├── auth.config.ts       # Auth configuration
├── exercises.ts         # Exercise CRUD operations
├── executions.ts        # Workout execution tracking
├── http.ts              # HTTP endpoints
├── schema.ts            # Database schema definitions
├── sequences.ts         # Sequence CRUD operations
├── settings.ts          # User settings management
└── tsconfig.json        # Convex-specific TypeScript config
```

### Key Files
- **schema.ts**: Defines database tables (exercises, sequences, sequenceExecutions, userSettings, auth tables)
- **exercises.ts**: list, get, create, update, softDelete, generateUploadUrl
- **sequences.ts**: list, get, create, update, softDelete, duplicate
- **executions.ts**: start, update, getHistory, exportData
- **settings.ts**: get, update user settings

## Source Directory (`src/`)
Frontend React application:

```
src/
├── components/          # React components
│   ├── ui/             # Radix UI-based design system (50+ components)
│   ├── navigation/     # Navigation components
│   │   └── main-nav.tsx
│   ├── ExerciseList.tsx
│   ├── ExerciseForm.tsx
│   ├── SEquenceList.tsx
│   ├── ExecuteSequence.tsx
│   ├── Settings.tsx
│   ├── DefaultCatchBoundary.tsx
│   └── NotFound.tsx
├── routes/              # TanStack Router file-based routing
│   ├── __root.tsx      # Root layout
│   ├── index.tsx       # Home page
│   ├── exercises/
│   │   └── index.tsx   # Exercise management page
│   ├── sequences/
│   │   └── index.tsx   # Sequence builder page
│   ├── settings/
│   │   └── index.tsx   # Settings page
│   ├── onboarding/
│   │   └── index.tsx   # Onboarding flow
│   └── api/
│       └── auth/
│           └── $.ts    # Auth catch-all route
├── lib/                 # Utility functions
│   ├── utils.ts        # General utilities (cn, etc.)
│   ├── auth.ts         # Auth utilities
│   └── auth-client.ts  # Auth client setup
├── hooks/               # Custom React hooks
│   └── use-mobile.ts   # Mobile detection hook
├── styles/              # Global styles
│   └── app.css         # Tailwind imports and global CSS
├── types/               # TypeScript type definitions
│   └── tanstack-start.d.ts
├── App.tsx              # App component
├── main.tsx             # Application entry point
├── router.tsx           # Router configuration
├── routeTree.gen.ts     # Generated route tree
├── consts.ts            # Constants (PORT = 3333)
├── SignInForm.tsx       # Sign in component
├── SignOutButton.tsx    # Sign out component
└── vite-env.d.ts        # Vite types
```

## UI Components (`src/components/ui/`)
Extensive Radix UI-based component library including:
- Layout: accordion, tabs, sidebar, resizable, separator
- Forms: input, textarea, select, checkbox, radio-group, switch, slider
- Feedback: alert, alert-dialog, dialog, drawer, tooltip, popover, sonner
- Data: table, chart, calendar, carousel, command
- Navigation: navigation-menu, breadcrumb, menubar, dropdown-menu, context-menu
- Content: card, badge, avatar, skeleton, empty, spinner, progress
- Buttons: button, button-group, toggle, toggle-group

## Routing Structure
TanStack Router with file-based routing:
- `__root.tsx`: Root layout with MainNav
- `index.tsx`: Home page
- `exercises/index.tsx`: /exercises
- `sequences/index.tsx`: /sequences  
- `settings/index.tsx`: /settings
- `onboarding/index.tsx`: /onboarding
- `api/auth/$.ts`: /api/auth/* (catch-all for auth routes)

## Data Models

### exercises
- name, description, sanskritName, photo, audio
- userId, deletedAt (soft delete)
- Index: by_user (userId)

### sequences  
- name, description, exerciseConfigs[]
- userId, deletedAt
- Index: by_user (userId)

### sequenceExecutions
- sequenceId, userId, startedAt, completedAt
- exerciseCompletions[] (exerciseId, completedValue, notes)
- Index: by_user (userId), by_sequence (sequenceId)

### userSettings
- userId, name, enableBeeps
- Index: by_user (userId, unique)

## Build Output
- Development: Runs on port 3333
- Production: `.output/server/` directory
- TypeScript build info: `tsconfig.tsbuildinfo`