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
- [x] Create `/exercises/$id/edit` route with full form
- [x] Pre-populate form with existing exercise data
- [x] Connect to update mutation

---

## Todo - Not Yet Implemented

### Phase 1: Core Workout Flow (MVP)

#### 1.1 Sequence Builder
- [x] **Sequence Editor** - Full editor to add/remove/reorder exercises
- [x] **Exercise Picker** - Select exercises to add to sequence
- [x] **Exercise Configuration** - Set goal, measure, targetValue per exercise
- [x] **Break Configuration** - Add and configure breaks
- [x] **Drag & Drop Reordering** - Reorder exercises in sequence
- [x] **Sequence Preview** - Preview before saving

#### 1.2 Workout Execution
- [x] **Sequence Execution UI** - Full workout player with timer, progress tracking
- [x] **Exercise Player** - Display exercise during workout (photos, videos, timer)
- [x] **Pause/Resume** - Handle workout interruptions
- [x] **Exercise Skip** - Skip exercises during workout
- [x] **Workout Complete Screen** - Summary and rating form
- [ ] **Audio/Haptic Feedback** - Beep countdown, haptic on complete

---

### Phase 2: Exercise Management

#### 2.1 Exercise CRUD
- [x] **Exercise Detail View** - Full exercise details page
- [x] **Exercise Edit** - Edit existing exercises
- [x] **Exercise Delete Confirmation** - Confirm before delete

#### 2.2 Exercise Enhancements
- [ ] **Media Preview** - Display photos/videos in forms
- [ ] **Body Part Selector** - Multi-select for body parts
- [ ] **Pre-built Exercises** - Seed default exercises

#### 2.3 Sequence CRUD
- [x] **Sequence Detail View** - Full sequence details page
- [x] **Sequence Edit** - Edit existing sequences
- [x] **Sequence Delete Confirmation** - Confirm before delete
- [ ] **Pre-built Sequences** - Seed default sequences

---

### Phase 3: Progress & History

#### 3.1 History Views
- [ ] **Workout History Page** - List of past workouts
- [ ] **Workout Detail View** - Details of a past workout
- [ ] **Personal Records Page** - View all PRs

#### 3.2 Data Visualization
- [ ] **Progress Charts** - Visualize progress over time
- [ ] **Calendar View** - See workouts on calendar
- [ ] **Export Data** - UI for data export

---

### Phase 4: Gamification & Achievements

#### 4.1 Achievement System
- [ ] **Achievements Page** - Display unlocked achievements
- [ ] **Badge Display** - Show badges on profile/home
- [ ] **Achievement Notifications** - Toast when badge unlocked

#### 4.2 Engagement Features
- [ ] **Streak Notifications** - Celebrate streak milestones
- [ ] **Level Up System** - Progress through levels

---

### Phase 5: Settings & Profile

#### 5.1 User Profile
- [ ] **Profile Page** - User profile with stats
- [ ] **Theme Switcher** - Energy vs Zen theme implementation

#### 5.2 Preferences
- [ ] **Notification Preferences** - Push notification settings
- [ ] **Data Management** - Delete account, export data
- [ ] **Accessibility Settings** - High contrast, font size

---

### Phase 6: Mobile & PWA

#### 6.1 Installation
- [ ] **Install Prompt** - Prompt user to install PWA

#### 6.2 Offline Capabilities
- [ ] **Offline Support** - Cache critical data for offline use
- [ ] **Background Sync** - Sync data when back online

#### 6.3 Native Features
- [ ] **Push Notifications** - Workout reminders
- [ ] **Share Target** - Accept shared content

---

### Phase 7: Quality & Polish

#### 7.1 User Experience
- [ ] **Error Boundaries** - Graceful error handling
- [ ] **Loading Skeletons** - Better loading states
- [ ] **Animations** - Page transitions, micro-interactions

#### 7.2 Visual Design
- [ ] **Dark Mode** - Full dark mode support
- [ ] **Responsive Design** - Tablet optimizations

#### 7.3 Performance
- [ ] **Performance Optimization** - Code splitting, lazy loading

---

### Phase 8: Testing & Documentation

#### 8.1 Automated Testing
- [ ] **Unit Tests** - Test utilities and hooks
- [ ] **Integration Tests** - Test API endpoints
- [ ] **E2E Tests** - Test user flows

#### 8.2 Documentation
- [ ] **Storybook** - Component documentation
- [ ] **API Documentation** - Document tRPC endpoints

---

## Notes

- All user data is scoped by `userId` for privacy
- Soft deletes are used (filter by `deletedAt`)
- tRPC provides end-to-end type safety
- TanStack Query handles caching and invalidation
- better-auth handles authentication
