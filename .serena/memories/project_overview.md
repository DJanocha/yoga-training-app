# Project Overview

## Purpose
This is a yoga training application that allows users to:
- Create custom yoga exercises with optional photos/audio
- Organize exercises into sequences with specific configurations
- Execute sequences with real-time tracking
- View progress over time
- Manage user settings and preferences

## Key Features
- **Exercise Management**: CRUD operations for custom yoga exercises
- **Sequence Builder**: Create ordered collections of exercises with goals (strict/elastic), measures (repetitions/time), and targets
- **Execution Tracking**: Start workout sessions, track completion, view history
- **Real-time Sync**: All data syncs in real-time via Convex backend
- **Authentication**: User-scoped data with @convex-dev/auth
- **File Storage**: Photo/audio upload support for exercises

## Tech Stack

### Frontend
- **React 19**: Latest React version with JSX transform
- **TanStack Router v1**: File-based routing with type-safe navigation
- **TanStack React Start**: Meta-framework for SSR/SSG capabilities
- **Vite 7**: Build tool and dev server
- **Tailwind CSS v4**: Utility-first CSS framework with @tailwindcss/vite
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library

### Backend
- **Convex**: Serverless backend-as-a-service with real-time capabilities
- **@convex-dev/auth**: Authentication library for Convex
- **@convex-dev/react-query**: TanStack React Query integration for Convex

### State Management
- **TanStack React Query v5**: Server state management
- **Convex Queries**: Real-time reactive queries

### Forms & Validation
- **React Hook Form**: Form state management
- **Zod v4**: Schema validation
- **@hookform/resolvers**: RHF + Zod integration

### TypeScript
- **Strict mode enabled**: Full type safety
- **Target**: ES2022
- **Module**: ESNext with bundler resolution