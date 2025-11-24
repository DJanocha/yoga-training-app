# YogaFlow App - Progress Tracker

This document tracks what has been implemented and what still needs to be done.

---

## Completed Features

### Infrastructure & Setup

- [x] Project scaffolding with TanStack Start + Vite
- [x] Database setup with Neon Postgres + Drizzle ORM
- [x] Authentication with better-auth
- [x] tRPC API layer with type-safe procedures
- [x] PWA configuration (manifest, service worker)
- [x] Tailwind CSS v4 styling
- [x] Shadcn/Radix UI component library
- [x] Environment variable validation with @t3-oss/env-core
- [x] File-based routing with TanStack Router

### Database Schema

- [x] `users` table (via better-auth)
- [x] `exercises` table with full schema (name, description, tips, modifications, level, category, bodyParts, photoUrls, videoUrls, links)
- [x] `sequences` table with exercises JSON, level, category, isFavorite
- [x] `sequenceExecutions` table with exercise tracking, rating, feedback, personalRecords
- [x] `userSettings` table with preferences, streaks, badges, theme
- [x] `achievements` table for badges and milestones
- [x] All indexes for optimized queries
- [x] Soft delete support via `deletedAt` field

### API Endpoints (tRPC)

#### Exercises Router
- [x] `list` - Get all user exercises
- [x] `filteredList` - Query with filters (level, category, bodyPart)
- [x] `byId` - Get single exercise
- [x] `create` - Create new exercise
- [x] `update` - Update exercise
- [x] `delete` - Soft delete exercise

#### Sequences Router
- [x] `list` - Get all user sequences
- [x] `byId` - Get single sequence
- [x] `create` - Create new sequence
- [x] `update` - Update sequence
- [x] `delete` - Soft delete sequence
- [x] `duplicate` - Clone a sequence
- [x] `toggleFavorite` - Toggle favorite status
- [x] `calculateDuration` - Calculate total sequence duration

#### Executions Router
- [x] `start` - Start a workout execution
- [x] `updateExecution` - Update execution progress
- [x] `submitRating` - Submit workout rating with PR detection
- [x] `getUserStats` - Get basic user stats
- [x] `getHistory` - Get workout history
- [x] `getDetailedStats` - Comprehensive stats (workouts, minutes, PRs, avg rating)
- [x] `getWeeklyProgress` - 7-day workout history
- [x] `exportData` - Export user data

#### Settings Router
- [x] `get` - Get user settings
- [x] `update` - Update settings
- [x] `calculateStreak` - Calculate current streak
- [x] `checkBadges` - Check and award badges

### Frontend Pages

#### Home Page (`/`)
- [x] Dashboard with stats grid (streak, total workouts, total time, avg rating)
- [x] Weekly goal progress bar
- [x] Personal records display
- [x] Quick action buttons (Start Workout, Browse Sequences)
- [x] Auth protection with loading states

#### Exercises Page (`/exercises`)
- [x] Exercise list display via `ExerciseList` component
- [x] Auth protection

#### Sequences Page (`/sequences`)
- [x] Sequence list display with cards
- [x] Filter UI (level, category)
- [x] Search functionality
- [x] Quick create form with TanStack Form
- [x] Duplicate/clone functionality
- [x] Empty state handling
- [x] Auth protection

#### Settings Page (`/settings`)
- [x] Settings form

#### Onboarding Page (`/onboarding`)
- [x] Initial user setup flow

#### Authentication Pages
- [x] Login page (`/login`)
- [x] Auth callback handling (`/auth/$pathname`)

### UI Components

- [x] `ActionBar` - Search, filter, create actions with three-button layout (Cancel, Add details, Create)
- [x] `EmptyState` - Empty list placeholder
- [x] `ExerciseList` - Exercise display with TanStack Form quick create
- [x] `ExerciseForm` - Exercise creation/editing
- [x] `ExecuteSequence` - Workout execution (exists but needs review)
- [x] `MobilePageHeader` - Mobile header
- [x] `FilterChips` - Filter display
- [x] `AppSidebar` - Navigation sidebar
- [x] Full Shadcn UI component library

### Form System (TanStack Form Composition)

- [x] Form context and hooks (`src/hooks/form-context.ts`, `src/hooks/form.ts`)
- [x] Form field components (`src/components/form-fields.tsx`):
  - [x] `TextField` - Text input
  - [x] `TextArea` - Multi-line text
  - [x] `Select` - Dropdown select
  - [x] `Slider` - Numeric slider
  - [x] `Switch` - Boolean toggle
  - [x] `NumberInput` - Numeric input
  - [x] `CheckboxGroup` - Multiple checkbox selection
  - [x] `StringArrayInput` - Dynamic array of strings (URLs, etc.)
  - [x] `SubscribeButton` - Form submit button
- [x] Form utilities (`src/lib/form-utils.ts`):
  - [x] `keyToLabel` - Derive labels from field names
  - [x] `getFieldLabel` - Get label with overrides
  - [x] `enumToSelectOptions` - Convert enums to select options
  - [x] Pre-built options for Level, Category, BodyPart, Theme
  - [x] Label overrides per entity (exercises, sequences, settings)
  - [x] Required field definitions and default values
- [x] Progressive disclosure pattern in ActionBar (quick create with required fields only)

---

## In Progress / Needs Work

### Schema Refactoring (See `.serena/memories/schema_duplication_refactoring.md`)
- [x] Move `db/schemas.ts` → `validators/entities.ts` (all entity Zod schemas in one place)
- [x] Update all imports in `validators/api/*.ts` to use `../entities`
- [x] Audit all `validators/api/*.ts` files for duplication (structure is acceptable)
- [x] Replace inline `z.object()` definitions with references to `db/types.ts` (exercises.ts uses Level, Category, BodyPart)
- [x] Ensure consistent naming convention (all use `*InputValidator` pattern)
- [x] Document the pattern for future additions (see `.serena/memories/schema_organization_pattern.md`)

**Target structure:**
- `db/` - Drizzle tables, types, connection only
- `validators/entities.ts` - Entity Zod schemas (insert/select/update)
- `validators/api/` - tRPC procedure input validators (derived from entities.ts)

### Exercise Edit Page
- [ ] Create `/exercises/$id/edit` route with full form
- [ ] Pre-populate form with existing exercise data
- [ ] Connect to update mutation

---

## Todo - Not Yet Implemented

### Core Workout Flow
- [ ] **Sequence Execution UI** - Full workout player with timer, progress tracking
- [ ] **Exercise Player** - Display exercise during workout (photos, videos, timer)
- [ ] **Pause/Resume** - Handle workout interruptions
- [ ] **Exercise Skip** - Skip exercises during workout
- [ ] **Workout Complete Screen** - Summary and rating form
- [ ] **Audio/Haptic Feedback** - Beep countdown, haptic on complete

### Exercise Management
- [ ] **Exercise Detail View** - Full exercise details page
- [ ] **Exercise Edit** - Edit existing exercises
- [ ] **Exercise Delete Confirmation** - Confirm before delete
- [ ] **Media Preview** - Display photos/videos in forms
- [ ] **Body Part Selector** - Multi-select for body parts
- [ ] **Pre-built Exercises** - Seed default exercises

### Sequence Builder
- [ ] **Sequence Editor** - Full editor to add/remove/reorder exercises
- [ ] **Exercise Picker** - Select exercises to add to sequence
- [ ] **Exercise Configuration** - Set goal, measure, targetValue per exercise
- [ ] **Break Configuration** - Add and configure breaks
- [ ] **Drag & Drop Reordering** - Reorder exercises in sequence
- [ ] **Sequence Preview** - Preview before saving
- [ ] **Sequence Detail View** - Full sequence details page
- [ ] **Sequence Edit** - Edit existing sequences
- [ ] **Sequence Delete Confirmation** - Confirm before delete
- [ ] **Pre-built Sequences** - Seed default sequences

### Progress & History
- [ ] **Workout History Page** - List of past workouts
- [ ] **Workout Detail View** - Details of a past workout
- [ ] **Progress Charts** - Visualize progress over time
- [ ] **Personal Records Page** - View all PRs
- [ ] **Calendar View** - See workouts on calendar
- [ ] **Export Data** - UI for data export

### Achievements & Gamification
- [ ] **Achievements Page** - Display unlocked achievements
- [ ] **Badge Display** - Show badges on profile/home
- [ ] **Achievement Notifications** - Toast when badge unlocked
- [ ] **Streak Notifications** - Celebrate streak milestones
- [ ] **Level Up System** - Progress through levels

### Settings & Profile
- [ ] **Profile Page** - User profile with stats
- [ ] **Theme Switcher** - Energy vs Zen theme implementation
- [ ] **Notification Preferences** - Push notification settings
- [ ] **Data Management** - Delete account, export data
- [ ] **Accessibility Settings** - High contrast, font size

### Mobile & PWA
- [ ] **Install Prompt** - Prompt user to install PWA
- [ ] **Offline Support** - Cache critical data for offline use
- [ ] **Push Notifications** - Workout reminders
- [ ] **Background Sync** - Sync data when back online
- [ ] **Share Target** - Accept shared content

### Quality & Polish
- [ ] **Error Boundaries** - Graceful error handling
- [ ] **Loading Skeletons** - Better loading states
- [ ] **Animations** - Page transitions, micro-interactions
- [ ] **Dark Mode** - Full dark mode support
- [ ] **Responsive Design** - Tablet optimizations
- [ ] **Performance Optimization** - Code splitting, lazy loading

### Testing & Documentation
- [ ] **Unit Tests** - Test utilities and hooks
- [ ] **Integration Tests** - Test API endpoints
- [ ] **E2E Tests** - Test user flows
- [ ] **Storybook** - Component documentation
- [ ] **API Documentation** - Document tRPC endpoints

---

## Priority Order (Suggested)

### Phase 1 - Core Workout Flow (MVP)
1. Sequence Editor - ability to add exercises
2. Sequence Execution UI - actually do workouts
3. Workout Complete Screen - finish and rate

### Phase 2 - Exercise Management
1. Exercise Detail/Edit
2. Media Preview
3. Pre-built Exercises

### Phase 3 - Progress Tracking
1. Workout History Page
2. Progress Charts
3. Calendar View

### Phase 4 - Gamification
1. Achievements Page
2. Badge Display
3. Notifications

### Phase 5 - Polish & Quality
1. Animations and transitions
2. Loading states
3. Error handling
4. Testing

---

## Notes

- All user data is scoped by `userId` for privacy
- Soft deletes are used (filter by `deletedAt`)
- tRPC provides end-to-end type safety
- TanStack Query handles caching and invalidation
- better-auth handles authentication
