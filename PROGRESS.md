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
- [x] **Auto-Advance Toggle** - Per-session toggle to enable/disable auto-advancing between exercises
- [x] **Actual Performance Tracking** - Adjust reps/time during workout, track actual vs target performance (rep +/- buttons, overtime timer for time-based)
- [x] **Audio/Haptic Feedback** - Beep countdown, haptic on complete

---

### Phase 2: Exercise Management

#### 2.1 Exercise CRUD
- [x] **Exercise Detail View** - Full exercise details page
- [x] **Exercise Edit** - Edit existing exercises
- [x] **Exercise Delete Confirmation** - Confirm before delete

#### 2.2 Exercise Enhancements
- [x] **Media Preview** - Display photos/videos in forms
- [x] **Body Part Selector** - Multi-select for body parts
- [x] **Pre-built Exercises** - Seed default exercises

#### 2.3 Sequence CRUD
- [x] **Sequence Detail View** - Full sequence details page
- [x] **Sequence Edit** - Edit existing sequences
- [x] **Sequence Delete Confirmation** - Confirm before delete
- [x] **Pre-built Sequences** - Seed default sequences

---

### Phase 3: Progress & History

#### 3.1 History Views
- [x] **Workout History Page** - List of past workouts
- [x] **Workout Detail View** - Details of a past workout
- [x] **Personal Records Page** - View all PRs

#### 3.2 Data Visualization
- [x] **Progress Charts** - Visualize progress over time
- [x] **Calendar View** - See workouts on calendar
- [x] **Export Data** - UI for data export

---

### Phase 4: Gamification & Achievements

#### 4.1 Achievement System
- [x] **Achievements Page** - Display unlocked achievements
- [x] **Badge Display** - Show badges on profile/home
- [ ] **Achievement Notifications** - Toast when badge unlocked

#### 4.2 Engagement Features
- [ ] **Streak Notifications** - Celebrate streak milestones
- [ ] **Level Up System** - Progress through levels

#### 4.3 Auth Error Handling & Navigation
- [x] **Better-auth-ui Integration** - Using @daveyplate/better-auth-ui v3 with built-in error toasts
- [x] **Sonner Toast Setup** - Toaster component configured in root layout
- [x] **AuthUIProvider Configuration** - Added onSessionChange callback (removed persistClient=false to enable session persistence)
- [x] **CSS Import** - Better-auth-ui styles imported via @source directive
- [x] **Auth Navigation Fix** - Use window.location for reliable post-auth redirects
- [x] **Session Invalidation** - Invalidate all queries on session change
- [x] **Vercel SPA Routing** - Created vercel.json with proper rewrites for client-side routes
- [x] **AuthView redirectTo Prop** - Added redirectTo="/" to prevent sign-out redirect loop
- [x] **Auth Event Logging** - Added hooks to log sign-in, sign-up, sign-out events with timestamps and user info
- [ ] **Safari Cookie Issue** - Login works on desktop browsers but Safari on mobile still has issues. Likely requires custom domain instead of *.vercel.app (public suffix domain). Tried sameSite: "lax" but issue persists.

**Note:** better-auth-ui automatically displays authentication errors via sonner toasts when using `<AuthView />` component. No additional error handling code required.

**Auth Navigation:** Using `window.location.href` and `window.location.replace()` for auth navigation instead of router hooks ensures reliable redirects after login/logout without requiring hard refresh. The `onSessionChange` callback invalidates all queries when auth state changes. The `redirectTo` prop on `<AuthView>` specifies where users should be redirected after successful authentication.

---

### Phase 5: Settings & Profile

#### 5.1 User Profile
- [x] **Account Settings Page** - Auth-related settings at /account/settings using better-auth-ui cards (UpdateAvatarCard, UpdateNameCard, ChangeEmailCard, ChangePasswordCard, SessionsCard, DeleteAccountCard)
- [x] **Preferences Page Split** - Separated app preferences (/preferences) from account settings (/account/settings)
- [x] **Theme Switcher** - Energy vs Zen theme selection in preferences

#### 5.2 Preferences
- [x] **Audio Settings** - Beep sounds and interval countdown preferences
- [x] **Display Settings** - Theme, haptic feedback, high contrast mode, PWA install
- [x] **Goals Settings** - Weekly workout goal configuration
- [x] **Data Management** - Export workout data as JSON
- [ ] **Notification Preferences** - Push notification settings (future)

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
- [x] **Error Boundaries** - Graceful error handling (DefaultCatchBoundary, NotFound components)
- [x] **Loading Skeletons** - Better loading states (HomePageSkeleton, ListPageSkeleton, etc.)
- [x] **Animations** - Framer Motion library with animation components (FadeIn, SlideUp, ScaleIn, etc.)

#### 7.2 Visual Design
- [x] **Dark Mode** - Full dark mode support with ThemeProvider, ThemeToggle, ThemeSelector
- [x] **Workout Themes** - Energy (vibrant orange) and Zen (sage green) color themes
- [x] **High Contrast Mode** - Accessibility option for increased text contrast
- [x] **Responsive Design** - Tablet optimizations (exercise grid, execute page, responsive utilities)

#### 7.3 Performance
- [x] **Performance Optimization** - Lazy loading for recharts (WeeklyActivityChart)

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

### Phase 9: Modifiers System (Equipment Tracking)

#### 9.1 Global Modifier Library
- [x] **Modifiers Table** - New database table for equipment (bands, blocks, weights)
- [x] **Modifier CRUD** - Create, read, update, delete modifiers
- [x] **Modifier Properties** - Name, unit (kg/cm/lbs/inches/level/none), value, description
- [x] **Modifiers Page** - `/modifiers` route for library management

#### 9.2 Sequence-Level Modifier Assignment
- [x] **Available Modifiers** - Select which modifiers are relevant for each sequence
- [x] **Sequence Schema Update** - Add `availableModifiers` JSONB field to sequences table

#### 9.3 Exercise-Level Modifier Assignment
- [x] **Modifier Assignment UI** - Assign modifiers to exercises within sequence builder (toggle buttons in exercise config sheet)
- [x] **Toggleable Badges** - Quick toggle modifiers on/off during workout execution with counter display

#### 9.4 Modifier-Aware PR Tracking
- [x] **Modifier Signature** - PRs tracked separately per modifier combination
- [x] **PR Display Update** - Show which modifiers were active when PR was set
- [x] **Achievement Updates** - Achievements respect modifier combinations

---

### Phase 10: Sequence Builder UX Improvements

#### 10.1 Configuration UI
- [x] **ButtonGroup for Measure** - Replace Select dropdown with toggle buttons (Time/Reps)
- [x] **Goal at Sequence Level** - Move strict/elastic from per-exercise to sequence level
- [x] **Auto-advance Connection** - Strict mode enables auto-advance, elastic disables it

#### 10.2 Exercise Management
- [x] **Duplicate Exercise Button** - Copy exercise with config, insert below
- [x] **Batch Configure (Apply to Many)** - Select any exercises, apply config to all (measure, target, modifiers)
- [x] **Multiply/Multi-Insert** - Insert exercise multiple times at once with count input
- [x] **Improved Break Insertion** - Show insertion points between exercises (not just append)

#### 10.3 Sequence-Level Settings
- [x] **Available Modifiers UI** - Multi-select modifiers for sequence (implemented in Phase 9.3)
- [x] **Per-Exercise Modifier Assignment** - Assign from available list with effect direction (implemented in Phase 9.3)

---

### Phase 11: Execution Flow Enhancements

#### 11.1 Modifier UI During Workout
- [ ] **Modifier Toggle Chips** - Display assigned modifiers as toggleable badges
- [ ] **Quick Toggle** - Enable/disable modifiers mid-exercise
- [ ] **Modifier Picker Sheet** - Full list of available modifiers

#### 11.2 Add Set Feature
- [ ] **Add Set Button** - After completing exercise, option to do another set
- [ ] **Set Number Tracking** - Track set 1, set 2, etc. separately
- [ ] **Different Modifiers Per Set** - Each set can have different modifiers active

#### 11.3 Display Fixes
- [ ] **Image Display** - Show exercise photos during workout execution
- [ ] **Goal Behavior** - Read strict/elastic from sequence level

---

### Phase 11.5: Schema & Type System Cleanup

#### 11.5.1 Convert Text Enums to Drizzle Enums
- [ ] **Convert Level enum** - Change `category: text('category')` to `category: text('category', {enum: ['beginner', 'intermediate', 'advanced']})`
- [ ] **Convert Category enum** - Change to `{enum: ['yoga', 'calisthenics', 'cardio', 'flexibility', 'strength']}`
- [ ] **Convert other enums** - GoalType, MeasureType, Theme, ModifierUnit, BodyPart (for array type, document pattern)
- [ ] **Update schema** - Regenerate migrations with `pnpm drizzle-kit generate`
- [ ] **Push to database** - Apply changes with `pnpm drizzle-kit push`

**Goal**: Use Drizzle's native enum support instead of text columns with TypeScript-only type hints.

#### 11.5.2 Consolidate Zod Schemas
- [ ] **Audit db/types.ts** - Review all schemas and determine which can be removed
- [ ] **Move refined schemas** - Move `refinedExerciseSchema`, `refinedSequenceSchema`, `refinedUserSettingsSchema`, `refinedModifierSchema` to appropriate validator files
- [ ] **Remove duplication** - Delete redundant schemas from `db/types.ts`, keep only:
  - Enums (Level, Category, BodyPart, GoalType, MeasureType, Theme, ModifierUnit, ModifierEffect, AchievementCategory)
  - Complex JSONB types (ExerciseConfig, SequenceExercise, ExerciseModifierAssignment, ActiveModifier, CompletedExercise, PersonalRecord, AchievementMetadata)
- [ ] **Update imports** - Fix all imports across the codebase to use correct schema locations
- [ ] **Document pattern** - Update schema_organization_pattern.md memory with final structure

**Goal**: Use drizzle-zod's `createInsertSchema`/`createSelectSchema` as the source of truth for table schemas, only keep custom Zod schemas in `db/types.ts` for JSONB field validation and complex nested types.

---

### Phase 12: Home & UX Quick Wins

#### 12.1 Home Screen
- [ ] **Reduce Tile Sizes** - Smaller stat cards for better mobile UX
- [ ] **Remove Redundant Button** - Remove "Browse Sequences" (duplicate of main nav)
- [ ] **Progress Chart** - Show exercise improvement over time (e.g., "10 push-ups last week → 12 this week")
- [ ] **Weekly Progress Display** - Top improving exercises sorted by % improvement

#### 12.2 Sequences
- [ ] **Sort by Last Used** - Default sort sequences by last execution date
- [ ] **Sorting Options** - Allow user to change sort order
- [ ] **Floating Action Button** - Quick start button always visible

#### 12.3 Achievements & Records
- [ ] **Merge PR into Achievements** - Move Personal Records into Achievements tab
- [ ] **Enhanced PR Thresholds** - 1-20 by 1, then by 5 (e.g., 20, 25, 30...)
- [ ] **Weekly Badges** - Small labels showing records/achievements from current week

#### 12.4 Rating System
- [ ] **Make Rating Optional** - One-tap skip option after workout

---

### Phase 13: Public Exercise Library (Future)

#### 13.1 Public Exercises System
- [ ] **Public/Private Toggle** - Make exercises shareable
- [ ] **Explore Tab** - Browse public exercises
- [ ] **Save System** - Save public exercises to personal library (ExerciseSaves table)
- [ ] **Save Counter** - Show popularity (hearts/saves count)
- [ ] **Creator Attribution** - Show who created exercise

#### 13.2 Exercise Versioning (Optional)
- [ ] **Version Management** - Track exercise updates
- [ ] **Migration Prompts** - Notify users of updated versions
- [ ] **Version History** - See exercise evolution

---

## Notes

- All user data is scoped by `userId` for privacy
- Soft deletes are used (filter by `deletedAt`)
- tRPC provides end-to-end type safety
- TanStack Query handles caching and invalidation
- better-auth handles authentication
