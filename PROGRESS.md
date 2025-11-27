# YogaFlow App - Progress Tracker

This document tracks what has been implemented and what still needs to be done.
Each phase should be commited separately using descriptive commit message eg: `Phase 1: Core Workout Flow (MVP)`

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
- [x] **Achievement Notifications** - Toast when badge unlocked (sonner toast)

#### 4.2 Engagement Features

- [x] **Streak Notifications** - Celebrate streak milestones (3, 7, 14, 30, 100 days)
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
- [ ] **Safari Cookie Issue** - Login works on desktop browsers but Safari on mobile still has issues. Likely requires custom domain instead of \*.vercel.app (public suffix domain). Tried sameSite: "lax" but issue persists.

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

- [x] **Install Prompt** - Prompt user to install PWA (banner on home page + button in preferences)

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

- [x] **Modifier Toggle Chips** - Display assigned modifiers as toggleable badges (implemented in Phase 9.3)
- [x] **Quick Toggle** - Enable/disable modifiers mid-exercise (implemented in Phase 9.3)
- [ ] **Modifier Picker Sheet** - Full list of available modifiers

#### 11.2 Add Exercise During Workout

- [x] **Add Exercise Button** - "+" button visible during workout execution
- [x] **Exercise Picker Modal** - Open exercise picker to select any exercise from library mid-workout
- [x] **Insert After Current** - Selected exercise is inserted immediately after the current exercise
- [x] **Persistence Prompt** - Ask user whether to save changes to sequence permanently or just for this workout

#### 11.2.1 Exercise Picker UX Improvements

- [x] **Set Value & Unit in Picker** - Add controls above/below exercise list: [-][numberInput][+][reps/time ButtonGroup] to configure exercise before adding
- [x] **Remove Multi-Insert** - Remove insert count feature from SequenceBuilder picker (prefer clicking duplicate/copy icon multiple times)
- [x] **Fix Scrollability** - Fix scroll issues in SequenceBuilder Exercises tab

#### 11.3 Display Fixes

- [x] **Image Display** - Show exercise photos during workout execution (already implemented)
- [x] **Goal Behavior** - Read strict/elastic from sequence level

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

- [x] **Reduce Tile Sizes** - Smaller stat cards for better mobile UX
- [x] **Remove Redundant Button** - Remove "Browse Sequences" (only "Start Workout" remains)
- [ ] **Progress Chart** - Show exercise improvement over time (e.g., "10 push-ups last week → 12 this week")
- [ ] **Weekly Progress Display** - Top improving exercises sorted by % improvement

#### 12.2 Sequences

- [x] **Sort by Last Used** - Default sort sequences by last execution date
- [x] **Sorting Options** - Allow user to change sort order (Last Used, Newest, Name, Favorites First)
- [ ] **Floating Action Button** - Quick start button always visible

#### 12.3 Achievements & Records

- [ ] **Merge PR into Achievements** - Move Personal Records into Achievements tab
- [ ] **Enhanced PR Thresholds** - 1-20 by 1, then by 5 (e.g., 20, 25, 30...)
- [ ] **Weekly Badges** - Small labels showing records/achievements from current week

#### 12.4 Rating System

- [x] **Make Rating Optional** - One-tap skip option after workout (already implemented)

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

### Phase 14: Exercise Groups

Allow users to merge exercises into named groups within sequences. Groups can be cloned, reordered as units, and progress is tracked during execution.

**Design Decisions:**

- Groups are metadata on top of flat exercise array (not nested hierarchy)
- Exercises in groups are referenced by stable IDs
- Groups appear at position of their first exercise
- Only ungrouped exercises can be selected for batch operations
- Cloned groups keep the same name
- Groups are collapsible in the builder UI
- Hooks extracted but kept in same file (SequenceBuilder.tsx) for now

#### 14.1 Data Model

- [x] **ExerciseGroup Type** - Add to `db/types.ts`: id, name, exerciseIds array
- [x] **Stable Exercise IDs** - Add optional `id` field to SequenceExercise schema (backwards compatible)
- [x] **Groups Column** - Add `groups` JSONB column to sequences table
- [x] **Zod Schema Update** - Add groups to refinedSequenceSchema
- [x] **Migration** - Generate and apply Drizzle migration

#### 14.2 Group Operations

- [x] **Merge into Group** - Select 2+ exercises → create named group
- [x] **Ungroup** - Dissolve group, exercises stay in place
- [x] **Clone Group** - Duplicate all exercises with new IDs, insert after original
- [x] **Rename Group** - Inline editing of group name
- [x] **Remove Item Cascade** - Removing exercise updates group, empty groups auto-delete

#### 14.3 Selection & Rendering

- [x] **Computed Render Order** - Build render items from flat array + groups
- [x] **Selection Rules** - Prevent selection of grouped exercises
- [x] **Batch Merge Button** - Add "Merge" to BatchActionsBar when 2+ selected

#### 14.4 Drag & Drop

- [x] **Group DnD** - Groups draggable as single units with `group:` ID prefix
- [x] **Target Detection** - Handle drops on groups vs exercises
- [x] **Exercise Order** - Keep group exercises contiguous in flat array

#### 14.5 UI Components

- [x] **SortableGroupItem** - Collapsible group card with drag handle
- [x] **GroupedExerciseRow** - Compact exercise display within group (integrated into SortableGroupItem)
- [x] **Group Header** - Name, collapse toggle, clone/ungroup actions

#### 14.6 Execution UI

- [x] **Group Progress Tracking** - Track position within current group
- [x] **Group Name Display** - Show group name and position during execution (e.g., "first (1/2)")

**Implementation complete.** Execution screen now shows group context when an exercise belongs to a group:

- "Exercise 1 of 41 · groupName (1/2)"
- Uses `getGroupContext()` helper to find group and position
- Ungrouped exercises show no additional context

**Files:** `src/routes/sequences/$id/execute.tsx`

#### 14.7 API Updates

- [x] **sequences.update** - Accept groups field
- [x] **sequences.duplicate** - Clone groups with new IDs

#### 14.8 Edge Cases

- [x] **Backwards Compatibility** - Generate IDs for exercises without them on load
- [x] **Orphaned References** - Filter invalid exercise IDs from groups (via removeItem cascade)
- [x] **Empty Groups** - Auto-delete groups with no exercises
- [x] **Validation** - Enforce min 1 char group name (via Zod schema)

---

### Phase 15: Sequence Editor UX Improvements

#### 15.1 Tabbed Interface

- [x] **Details Tab** - Sequence metadata (name, description, goal type, available modifiers)
- [x] **Exercises Tab** - Exercise management (list, picker, config, groups, batch operations)
- [x] **Tab State** - Defaults to Exercises tab, shows exercise count badge

---

### Phase 16: Floating Action Dock (Inspired by shadcn Dock)

**Design inspiration:** https://www.shadcn.io/components/dock/message-dock

Redesign the sequence builder action bar as a modern floating dock with smooth animations and contextual expansion.

#### 16.1 Floating Dock Component

- [x] **Fixed Bottom Position** - Dock floats at bottom of screen (above navigation) like iOS/macOS dock
- [x] **Backdrop Blur Effect** - Semi-transparent background with `backdrop-filter: blur(12px)`
- [x] **Circular Icon Buttons** - Replace rectangular buttons with circular icon buttons
- [x] **Spring Animations** - Use Framer Motion with spring physics for expand/collapse
- [x] **Separator Lines** - Animated vertical dividers between action groups

#### 16.2 Icon-based Action Design

Primary actions (always visible):

- [x] **Select** - ✓ icon (checkmark) - Toggles selection mode
- [x] **Add** - + icon (plus) - Opens ExercisePickerDrawer with exercises AND breaks

Selection actions (appear when items selected):

- [x] **Merge** - ⛓️ icon (link/chain) - Merge selected into group
- [x] **Clone** - 📋 icon (clipboard) - Duplicate selected items
- [x] **Configure** - ⚙️ icon (gear) - Configure selected items with badge count (e.g., "2")
- [x] **Delete** - 🗑️ icon (trash) - Delete selected items

#### 16.3 Dock States & Animations

```
Default (compact, ~80px width):
┌────────────────────┐
│    [✓]    [+]      │  ← Primary actions only
└────────────────────┘

Selection Active (expanded, ~300px width):
┌──────────────────────────────────────┐
│  [⛓️] [📋] [⚙️²] [🗑️]  │  [✕] [+]  │  ← Selection + Primary
└──────────────────────────────────────┘
           ↑ badge shows count
```

- [x] **Smooth Expansion** - Dock expands left-to-right when entering selection mode
- [x] **Icon Animations** - Icons scale up on hover/press (1.1x)
- [x] **Badge Count** - Show selected count on Configure button
- [x] **Disabled States** - Gray out unavailable actions (e.g., Merge when < 2 selected)

#### 16.4 Break as Special Exercise

- [x] **Break in Exercise List** - Add "Break" as a special item at the TOP of ExercisePickerDrawer list
- [x] **Visual Distinction** - Style break with Coffee icon (☕), different background color (e.g., blue-50)
- [x] **Default Config** - Breaks default to 10 seconds (time-based, hardcoded)
- [x] **Simplified Add** - Remove separate "Add Break" button, unify into single "Add" action

#### 16.5 Enhanced Interactions

- [x] **Click Outside to Cancel** - Clicking outside dock or list exits selection mode
- [x] **Keyboard Shortcuts** - Esc to cancel selection, Delete key for delete action
- [x] **Touch-friendly** - Larger touch targets (48px minimum) for mobile
- [x] **Haptic Feedback** - Vibration on action button press (if enabled in settings)
- [x] **Visual Feedback** - Active state glow/highlight on pressed buttons

#### 16.6 Visual Polish

- [ ] **Gradient Background** - Subtle gradient in dock background (skipped - kept simple bg-background/95)
- [x] **Shadow/Elevation** - Depth with `box-shadow` to lift dock above content
- [ ] **Hover Effects** - Tooltip labels appear above icons on hover (future enhancement)
- [x] **Smooth Transitions** - All state changes use spring animations (stiffness: 300, damping: 30)
- [x] **Reduced Motion** - Respect `prefers-reduced-motion` for accessibility

**Benefits:**

- Modern, polished aesthetic matching contemporary mobile apps
- Minimal space usage when inactive (just 2 icons)
- Clear visual feedback for all interactions
- Smooth, delightful animations
- Better touch interaction on mobile
- Consistent with platform conventions (iOS/macOS dock pattern)

---

### Phase 17: UX Bug Fixes

Collection of UX issues discovered during testing.

#### 17.1 Exercise Form Issues

- [x] **Form not pre-filled** - Form IS pre-filled via useEffect (was already working, verified)
- [x] **Buttons overflow container** - Added sticky positioning with `bg-card` background
- [x] **Dark mode colors** - Replaced all hardcoded colors with theme-aware classes (`bg-card`, `text-foreground`, `border-border`, `bg-muted`, `bg-primary`, etc.)
- [x] **Body parts labels invisible** - Added `text-foreground` to checkbox labels

**Files**: `src/components/ExerciseForm.tsx`

#### 17.2 ActionBar Search UX

- [x] **No auto-scroll on search open** - Added `scrollIntoView` when search state activates
- [x] **No auto-focus scroll** - Input ref with `scrollIntoView({ behavior: "smooth", block: "center" })`

**Files**: `src/components/action-bar.tsx`

#### 17.3 iOS Zoom on Input Focus

- [x] **Group rename input triggers zoom** - Changed `text-sm` to `text-base` (16px)
- [x] **Zoom persists after editing** - Fixed by using proper font size
- [x] **Fix**: Changed input and button font-size to `text-base`, increased height to `h-8`

**Files**: `src/components/SequenceBuilder.tsx` (SortableGroupItem component)

**iOS Zoom Prevention Rule**: All `<input>` and `<textarea>` elements must use `text-base` (16px) or larger font size to prevent Safari's auto-zoom behavior on focus.

---

### Phase 18: Execution Navigation & Runtime Editing

Improve workout execution UX with visual navigation, undo capability, and runtime exercise configuration changes.

**User Stories:**

1. "I accidentally clicked 'Done' - let me go back and redo that exercise"
2. "I want to change the rep count while doing the exercise using a wheel"
3. "I misconfigured an exercise (10s instead of 10x) - let me fix all occurrences"

#### 18.1 Segmented Progress Bar with Navigation

Replace the simple progress bar with a tappable segmented indicator showing exercise status.

**Visual Design:**

```
┌─────────────────────────────────────────────────────────────┐
│  [←]  [🟢][🟢][🟢][⬜][🔵▼][⬜][⬜][⬜][⬜][⬜]  [→]        │
│        1   2   3   4   5    6   7   8   9  10               │
│             ↑ tappable segments                              │
└─────────────────────────────────────────────────────────────┘

Legend:
🟢 = completed (green)
⬜ = skipped (gray)
🔵▼ = current position (blue with indicator arrow)
○ = pending (outline only)
```

**New Component**: `SegmentedProgressBar`

- [x] **File**: `src/components/ui/segmented-progress.tsx`
- [x] **Props**: `exercises`, `completedExercises`, `currentIndex`, `onNavigate`
- [x] **Segment Rendering** - Map exercises to colored segments based on completion status
- [x] **Tappable Segments** - Click/tap any segment to navigate to that exercise
- [x] **Arrow Buttons** - Left/right arrows at ends for explicit navigation
- [x] **Current Position Marker** - Blue indicator arrow pointing at current exercise
- [x] **Responsive Sizing** - Segments shrink on mobile for long sequences (min 8px width)
- [x] **Overflow Handling** - Horizontal scroll for very long sequences (>20 exercises)

**State Changes in `execute.tsx`**:

- [x] **Add `viewingIndex`** - Separate from `currentIndex` to allow reviewing past exercises
- [x] **Add `isReviewing` mode** - Boolean flag for review vs execution mode
- [x] **Review Mode Behavior**:
  - Timer paused when reviewing
  - Show exercise details but grayed out controls
  - "Resume" button to return to `currentIndex`
  - "Redo" button to reset exercise and continue from there
- [x] **Navigation Handler** - `handleNavigate(targetIndex)`:
  - If `targetIndex < currentIndex`: Enter review mode
  - If `targetIndex === currentIndex`: Exit review mode
  - If `targetIndex > currentIndex`: Not allowed (can't skip ahead)

**Review Mode UI**:

- [x] **Dimmed Overlay** - 50% opacity overlay on main content
- [x] **Review Banner** - "Reviewing Exercise 3 of 10" with Resume/Redo buttons
- [ ] **Exercise Summary** - Show recorded value, time spent, modifiers used (deferred)
- [ ] **Redo Confirmation** - Dialog: "Redo this exercise? Previous result will be discarded." (simplified - direct redo)

**Redo Logic**:

- [x] **Remove from completedExercises** - Pop all exercises from target index onwards
- [x] **Reset state** - `setCurrentIndex(targetIndex)`, `setTimeElapsed(0)`, `setActualValue(targetValue)`
- [x] **Exit review mode** - `setIsReviewing(false)`, `setViewingIndex(null)`

---

#### 18.2 Wheel for Runtime Value Changes

Replace +/- buttons with wheel component during exercise execution.

**Current Implementation** (lines 616-654 in execute.tsx):

```tsx
<Button onClick={() => setActualValue(Math.max(0, actualValue - 1))}>
  <Minus />
</Button>
<div>{actualValue}</div>
<Button onClick={() => setActualValue(actualValue + 1)}>
  <Plus />
</Button>
```

**New Implementation**:

- [x] **Import WheelNumberInput** - From `@/components/ui/wheel-number-input`
- [x] **Replace +/- buttons with wheel**:

```tsx
<WheelNumberInput
  value={actualValue}
  onChange={setActualValue}
  min={1}
  max={measure === "time" ? 300 : 100}
  step={measure === "time" ? 5 : 1}
/>
```

- [x] **Conditional Step Size**:
  - Time-based: step=5 (5s increments for easier scrolling) - N/A (time uses countdown)
  - Rep-based: step=1 (precise rep counting)
- [x] **Larger Display** - Increase wheel height for execution context (size="lg" prop)
- [x] **Touch-Friendly Sizing** - Minimum 48px touch targets

**Bonus: Measure Type Switcher**:

- [ ] **Add WheelSelect for measure** - Allow switching time ↔ reps during exercise
- [ ] **Side-by-side wheels layout**:

```
┌────────────────────────────────┐
│   [value wheel] [measure wheel] │
│       30           time          │
│       31           reps   ←      │
│       32                         │
└────────────────────────────────┘
```

- [ ] **Confirmation on change** - "Change from 10 seconds to 10 reps?"

---

#### 18.3 Bulk Exercise Configuration Updates

When changing exercise config during execution, offer options to apply to multiple occurrences.

**Trigger Points**:

1. User changes measure type (time ↔ reps) during execution
2. User significantly changes target value (+/- 50% from original)
3. User taps "Edit Config" button (new button to add)

**New Component**: `ExerciseConfigUpdateDialog`

- [x] **File**: `src/components/exercise-config-update-dialog.tsx`
- [x] **Props**: `exercise`, `oldConfig`, `newConfig`, `sequence`, `onApply`, `onCancel`

**Matching Logic** (find similar exercises):

```typescript
type UpdateScope =
  | "this-only" // Just this occurrence
  | "same-group" // All in same group (if grouped)
  | "all-in-sequence" // All occurrences of this exercise in sequence
  | "same-config"; // All with identical config (e.g., all "10s push-ups")

function findMatchingExercises(
  exercises: SequenceExercise[],
  targetExercise: SequenceExercise,
  scope: UpdateScope,
  groups?: ExerciseGroup[]
): number[]; // Returns indices to update
```

**Dialog UI**:

```
┌─────────────────────────────────────────────────────────┐
│  Update Exercise Configuration                          │
│                                                         │
│  Changing: Push-up 10s → Push-up 10x                    │
│                                                         │
│  ○ This occurrence only                                 │
│  ○ All in group "Morning Set" (3 matches)    ← if grouped│
│  ○ All "Push-up" in sequence (5 total)                  │
│  ○ All with same config "10s" (2 matches)               │
│                                                         │
│  ─────────────────────────────────────────────          │
│  □ Save changes permanently to sequence                 │
│                                                         │
│  [Cancel]                              [Apply]          │
└─────────────────────────────────────────────────────────┘
```

**Implementation Steps**:

- [x] **Match Counter** - Show count for each option (e.g., "3 matches")
- [x] **Preview List** - Expandable list showing which exercises will be affected
- [x] **Radio Selection** - Single choice from scope options
- [x] **Persistence Checkbox** - "Save changes permanently to sequence"
- [x] **Apply Handler**:
  - Update `workoutExercises` state for session changes
  - If persist checked: call `updateSequence.mutate()` with modified exercises
  - Show toast: "Updated X exercises"

**State Updates**:

- [x] **Add `pendingConfigChange`** - Track when config change is in progress
- [x] **Add `showConfigDialog`** - Boolean to show/hide dialog
- [x] **Update workoutExercises** - Modify multiple indices in array

**Edge Cases**:

- [x] **Already completed exercises** - Only update future occurrences, not completed ones
- [x] **Group integrity** - If updating group members, maintain group structure
- [ ] **Undo support** - Store previous state for potential undo (deferred)

---

#### 18.4 Integration & Polish

**Progress Bar Integration**:

- [x] **Replace Progress component** - Swap `<Progress>` with `<SegmentedProgressBar>`
- [x] **Header layout update** - Move progress bar below header, add arrow buttons
- [x] **Animation** - Smooth transitions when segments change color

**Wheel Integration**:

- [x] **Conditional rendering** - Show wheel only for rep-based exercises (time uses countdown)
- [x] **Layout adjustment** - Center wheel in main content area
- [x] **Visual feedback** - Target indicator shows when value differs from target

**Config Dialog Integration**:

- [x] **Trigger button** - Add "Edit" button (pencil icon) near exercise name during execution
- [ ] **Auto-trigger** - Optionally trigger when measure type changes (deferred)
- [x] **Keyboard support** - Escape to cancel, Enter to apply (via AlertDialog built-in behavior)

**Accessibility**:

- [x] **ARIA labels** - All interactive elements have proper labels
- [x] **Focus management** - Focus moves logically through components
- [ ] **Screen reader** - Announce navigation changes and config updates

---

#### 18.5 Files to Modify

| File                                               | Changes                                                                                                                          |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/sequences/$id/execute.tsx`             | Add viewingIndex, isReviewing state; replace Progress with SegmentedProgressBar; replace +/- with wheel; add config edit trigger |
| `src/components/ui/segmented-progress.tsx`         | NEW - Segmented progress bar component                                                                                           |
| `src/components/exercise-config-update-dialog.tsx` | NEW - Bulk config update dialog                                                                                                  |
| `src/components/ui/wheel-number-input.tsx`         | Add size variant prop for larger execution display                                                                               |
| `src/db/types.ts`                                  | Add UpdateScope type if needed                                                                                                   |

---

#### 18.7 Insert Position Choice

Add a third wheel to the exercise picker during execution for choosing insert position.

**UI Design:**

```
┌────────────────────────────────────────────────┐
│  Add Exercise                              ✕   │
│  Select an exercise to add                     │
│                                                │
│   [29]      [reps]      [before]               │
│   [30]      [sec ]      [after ] ←             │
│   [31]      [    ]      [      ]               │
│                                                │
│  Value      Unit       Position                │
└────────────────────────────────────────────────┘
```

- [x] **Add position wheel** - Third `WheelSelect` with options: "before", "after"
- [x] **Default to "after"** - Preserves existing behavior
- [x] **Dynamic description** - Update text: "Select an exercise to add"
- [x] **Update insert logic** - `insertIndex = position === 'before' ? currentIndex : currentIndex + 1`
- [x] **Pass position to handler** - Update `handleExerciseSelected` signature to include position

**Files**: `src/components/exercise-picker-drawer.tsx`, `src/routes/sequences/$id/execute.tsx`

---

#### 18.8 Implementation Order

1. **Segmented Progress Bar** (Feature 1)

   - Create component with basic rendering
   - Add tap navigation
   - Add arrow buttons
   - Integrate review mode

2. **Wheel for Values** (Feature 2)

   - Replace +/- buttons
   - Add measure type switcher (optional)
   - Polish touch interactions

3. **Bulk Config Updates** (Feature 3)
   - Create matching logic
   - Build dialog component
   - Add persistence option
   - Integrate with execution flow

---

### Phase 19: Unified Group & Exercise Selection

Redesign selection system to treat groups and exercises uniformly, enabling more powerful batch operations.

#### 19.1 Unified Selection Model

**Core Concept:** All actions work on "effective selection" = all exercises (flattened from groups + standalone)

```
Select anything (groups, exercises, mix)
     ↓
Effective selection = selectedGroups.flatMap(g => g.exercises) + selectedExercises
     ↓
All actions apply to effective selection:
- Configure → applies to all exercises
- Merge → creates new group containing all
- Delete → removes all (groups dissolve, exercises removed)
- Clone → duplicates all
```

- [x] **Enable group selection** - Allow selecting groups in addition to exercises
- [x] **Visual selection state** - Show selected state on group cards (border highlight, checkbox)
- [x] **Mixed selection** - Support selecting groups + standalone exercises together
- [x] **Selection count** - Badge shows total exercise count (flattened), not item count

#### 19.2 Batch Operations on Groups

- [x] **Batch configure with groups** - Configure selection applies to all exercises inside selected groups
- [x] **Flatten logic** - `getEffectiveSelection(selectedIds, groups, exercises)` returns exercise IDs
- [x] **Merge mixed selection** - Merge groups + exercises into new group (name = first group name or first exercise name)
- [x] **Clone mixed selection** - Duplicate all selected (groups stay as groups, exercises stay as exercises)

#### 19.3 Delete Group Action

- [x] **Add delete group button** - Trash icon next to clone/ungroup buttons in group header
- [x] **Confirmation dialog** - AlertDialog: "Delete group and X exercises? This action cannot be undone."
- [x] **Batch delete** - When groups selected, delete removes groups + all their exercises

#### 19.4 Group Header Actions

Implemented: `[Clone] [Ungroup] [Delete]`

```
┌─────────────────────────────────────────────────────┐
│  ⋮⋮  ∨  Morning Set    [3]    [📋] [⛓️‍💥] [🗑️]     │
│         ↑ collapse      count  clone ungroup delete │
└─────────────────────────────────────────────────────┘
```

- [x] **Delete button** - Trash icon, red on hover (`hover:bg-destructive/10 hover:text-destructive`)
- [x] **Confirmation** - AlertDialog with destructive action styling

**Files**: `src/components/SequenceBuilder.tsx`

---

### Phase 20: Default Exercise Configuration

Add sequence-level default config so new exercises inherit sensible defaults instead of always 30s.

#### 20.1 Use Case

| Sequence Type   | Ideal Default   |
| --------------- | --------------- |
| Yoga/Stretching | 60s (holds)     |
| Calisthenics    | 10x (reps)      |
| HIIT/Cardio     | 30s (intervals) |
| Strength        | 5x (heavy reps) |

Currently all new exercises default to 30s regardless of sequence type.

#### 20.2 Schema Changes

Add to sequences table:

```typescript
defaultExerciseConfig: {
  measure: "time" | "repetitions";
  targetValue: number;
}
```

- [x] **Add schema field** - `defaultExerciseConfig` JSONB column in sequences table
- [x] **Migration** - Generate and apply Drizzle migration
- [x] **Default value** - `{ measure: 'time', targetValue: 30 }` for backwards compatibility
- [x] **Zod schema** - Add to `refinedSequenceSchema`

#### 20.3 UI in Sequence Details

Place under Goal Type in Details tab:

```
┌─────────────────────────────────────────────────────┐
│  Sequence Details                                   │
│                                                     │
│  Name: [Cali v1                    ]                │
│  Description: [Optional description ]               │
│                                                     │
│  Goal Type                                          │
│  [Strict (exact target)] [Elastic (flexible)]       │
│                                                     │
│  Default Exercise Config                            │
│  New exercises will use these defaults              │
│                                                     │
│       [10]        [reps]                            │
│       [  ]        [sec ]                            │
│                                                     │
│      Value         Unit                             │
│                                                     │
│  ▼ Available Modifiers                              │
└─────────────────────────────────────────────────────┘
```

- [x] **Add wheels to Details tab** - Value + Unit wheels under Goal Type
- [x] **Label** - "Default Exercise Config" with helper text
- [x] **Save with sequence** - Include in update mutation

#### 20.4 Apply Defaults

- [x] **Exercise picker uses defaults** - Initialize wheels with `sequence.defaultExerciseConfig`
- [x] **Fallback** - If no default set, use `{ measure: 'time', targetValue: 30 }`
- [x] **Add Break exception** - Breaks always default to 10s time regardless of sequence default (hardcoded in addBreak function)

**Files**:

- `src/db/schema.ts` - Add column
- `src/db/types.ts` - Add type
- `src/components/SequenceBuilder.tsx` - Details tab UI
- `src/components/exercise-picker-drawer.tsx` - Use defaults
- `src/validators/api/sequences.ts` - Update validators

---

### Phase 21: Unified Mode Dock (Message-Dock Pattern)

Redesign the floating action dock to follow the message-dock pattern with distinct modes that expand when active.

**Design Inspiration:** `src/components/ui/shadcn-io/message-dock/index.tsx`

**Core Concept:** The dock shows available modes as icons. Clicking a mode activates it and expands the dock to show mode-specific content.

#### 21.1 Mode-Based Architecture

```
Collapsed (all modes visible as icons):
┌─────────────────────────────────────────┐
│   [☐]     [+]     [?]     [≡]           │
│  Select   Add    Help   Menu            │
└─────────────────────────────────────────┘

Expanded (Select mode active):
┌─────────────────────────────────────────┐
│ [☑]  [Merge] [Clone] [Config] [Delete]  │
│  ↑ active mode indicator                │
└─────────────────────────────────────────┘

Expanded (Add mode active - vertical expansion):
┌─────────────────────────────────────────┐
│  [Search exercises...]                  │
│  ┌─────────────────────────────────┐    │
│  │ ☕ Break (10s default)          │    │
│  │ 🧘 Downward Dog                 │    │
│  │ 💪 Push-up                      │    │
│  │ ...scrollable list...           │    │
│  └─────────────────────────────────┘    │
│  [30] [sec]  ← config wheels            │
│─────────────────────────────────────────│
│   [☐]    [+]     [?]     [≡]            │
│          ↑ active                       │
└─────────────────────────────────────────┘
```

- [x] **Mode Icons** - Square (select), Plus (add), HelpCircle (help), Menu (options)
- [x] **Active State Indicator** - Highlighted background, filled icon variant
- [x] **Mode Switching** - Click inactive mode to switch, click active mode to collapse
- [x] **Smooth Transitions** - Spring animations for expand/collapse

#### 21.2 Selection Mode Content

When Selection mode is active:

- [x] **Checkbox Icon States** - `Square` when off, `CheckSquare` when on (not Check/X)
- [x] **Selection Actions Row** - Merge, Clone, Configure, Delete buttons
- [x] **Badge Counts** - Show selected count on Configure button
- [x] **Disabled States** - Gray out Merge when < 2 selected
- [x] **Visual Differentiation** - Actions use distinct colors/styles (not all same)

#### 21.3 Add Exercise Mode Content

When Add mode is active, dock expands vertically (like action-bar pattern):

- [x] **Inline Exercise Picker** - No separate drawer, content in expanded dock
- [x] **Search Input** - Filter exercises by name
- [x] **Break at Top** - Special "Break" item with Coffee icon, blue styling
- [x] **Scrollable Exercise List** - Max height with overflow scroll
- [x] **Compact Wheel Variant** - Smaller wheel components for constrained space
- [x] **Quick Add** - Tap exercise to add with current config
- [x] **Config Wheels** - Value and Unit wheels at bottom of expanded area

#### 21.4 Help Mode Content

When Help mode is active:

- [x] **Contextual Tips** - 2-3 sentences about current screen
- [x] **Feature Hints** - Explain what each mode does
- [x] **Expandable Sections** - "What are groups?", "What are modifiers?"
- [x] **Dismiss** - Tap outside or click Help again to close

#### 21.5 Compact Wheel Component Variant

New size variant for wheels to fit in constrained dock space:

- [x] **Size Prop** - `size="compact" | "default" | "large"`
- [x] **Compact Dimensions** - Reduced height (h-24 vs h-32)
- [x] **Smaller Font** - Proportionally scaled text
- [x] **Touch Targets** - Maintain 44px minimum despite smaller visuals

#### 21.6 Technical Implementation

- [x] **Refactor FloatingActionDock** - Support multiple modes with expandable content
- [x] **Mode State Management** - `activeMode: 'select' | 'add' | 'help' | null`
- [x] **Content Slots** - Pass mode-specific content as children/props
- [x] **Height Animation** - Animate max-height for vertical expansion
- [x] **Keyboard Support** - Tab between modes, Escape to collapse

**Files to Modify/Create:**

- `src/components/ui/floating-action-dock.tsx` - Major refactor
- `src/components/ui/wheel-number-input.tsx` - Add compact variant
- `src/components/ui/wheel-select.tsx` - Add compact variant
- `src/components/SequenceBuilder.tsx` - Integrate new dock

---

### Phase 22: Execution Control Dock

Add a floating dock to the workout execution screen for unified navigation and control.

**User Stories:**

1. "I want quick access to pause/resume without looking for the button"
2. "I accidentally completed an exercise - let me go back"
3. "I want to add an exercise mid-workout easily"

#### 22.1 Execution Dock Layout

```
┌─────────────────────────────────────────────────────┐
│  [←]    [⏸️/▶️]    [✓]    [+]    [→]                │
│  prev   pause     done   add   next                 │
└─────────────────────────────────────────────────────┘
```

- [x] **Previous Button** - Navigate to previous exercise (enter review mode)
- [x] **Pause/Play Toggle** - Pause timer, show paused state
- [x] **Done/Complete Button** - Mark current exercise as complete
- [x] **Add Exercise Button** - Insert exercise after current (existing feature)
- [x] **Next Button** - Skip to next exercise (with confirmation if not completed)

#### 22.2 Button States & Feedback

- [x] **Previous Disabled** - Gray out when at first exercise
- [x] **Next Disabled** - Gray out when at last exercise
- [ ] **Done Highlight** - Pulse/glow when timer complete (time-based exercises)
- [x] **Pause State** - Visual indicator when paused (icon change, color shift)
- [x] **Haptic Feedback** - Vibration on button press

#### 22.3 Navigation Confirmation

- [x] **Skip Confirmation** - "Skip this exercise?" dialog when pressing Next without completing
- [x] **Review Mode Integration** - Previous button enters review mode (from Phase 18.1)
- [ ] **Quick Redo** - Long-press Previous to redo current exercise

#### 22.4 Dock Position & Styling

- [x] **Fixed Bottom** - Always visible above safe area
- [x] **Backdrop Blur** - Semi-transparent with blur
- [x] **Shadow/Elevation** - Lifted above content
- [x] **Responsive Width** - Full width on mobile, centered max-width on tablet

#### 22.5 Integration with Existing Controls

- [x] **Remove Scattered Buttons** - Consolidate existing prev/next/done buttons into dock
- [x] **Timer Display** - Keep timer prominent in main content area
- [x] **Exercise Info** - Keep exercise name/details in main area
- [x] **Segmented Progress** - Progress bar sits above dock (from Phase 18.1)

#### 22.6 Review & Edit Mode for Completed Exercises

**Problem**: User at exercise 15 realizes they forgot to set a modifier on exercise 2. Without edit mode, they'd have to redo 13 exercises.

**Solution**: Add edit mode for completed exercises during review.

- [x] **Review Mode** - Navigate to past exercises, see recorded values (read-only by default)
- [x] **Edit Mode Activation** - Click Edit (pencil) button to enter edit mode
- [x] **Editable Values** - GameTimer and GameCounter become editable when in edit mode
- [x] **Editable Modifiers** - EquipmentGrid becomes editable when in edit mode
- [x] **Edit Mode Dock Layout** - `[Edit (indicator)] | [Cancel] [Save]` with separator
- [x] **Save/Cancel** - Save updates `completedExercises` array, Cancel discards changes
- [x] **Keyboard Shortcuts** - E to edit, Enter to save, Escape to cancel
- [x] **Visual States** - Blue styling for edit mode, amber for review mode
- [x] **Disabled States** - Edit button only shown for completed (not skipped) exercises

**ExecutionDock Layouts** (current implementation, screen-specific):
```
Active exercise:    [←] [Skip] [✓ Complete] [+] [→]
Reviewing past:     [←] [Edit] [▶ Resume] [Redo] [→]
Editing past:       [Edit] | [Cancel] [Save]
```

Note: These are screen-specific states in ExecutionDock, not part of the unified Dock component design.

**Files**:
- `src/components/ui/execution-dock.tsx` - Edit mode dock layout with separator pattern
- `src/routes/sequences/$id/execute.tsx` - Edit state, handlers, value/modifier wiring
- `src/components/ui/game-timer.tsx` - Dark variant for editable wheels
- `src/components/ui/game-counter.tsx` - Disabled prop for read-only state
- `src/components/ui/wheel-select.tsx` - Dark variant for game-style backgrounds
- `src/components/ui/wheel-number-input.tsx` - Variant prop passthrough

---

### Phase 30: Unified Dock Component

Unify `ExecutionDock` and `UnifiedModeDock` into a single reusable `Dock` component with declarative action-based API.

**Design Goal**: Single dock component that handles all current use cases with clean, composable API.

#### 30.1 Type System

```typescript
type Action = {
  id: string
  icon: LucideIcon
  label?: string                      // Text label (e.g., "Cancel", "Save")
  content?: ReactNode                 // Expanded content (panel above or inline)
  contentPosition?: "above" | "inline" // Where content renders, default "inline"
  bgClassName?: string                // Button background styling
  badge?: ReactNode | number          // Count indicator
  onClick?: () => void                // For instant actions
  disabled?: boolean
  hidden?: boolean
}

type PrimaryAction = Action & {
  secondaryActions: Action[]          // Always array, possibly empty
  shouldHideSecondaryActions?: boolean // Conditional hiding (e.g., nothing selected)
}

type DockProps = {
  actions: PrimaryAction[]
  activeActionId: string | null
  onActionActivate: (id: string | null) => void
  statusLabel?: ReactNode             // Text below dock ("Editing 10 / 41")
  className?: string
  enableAnimations?: boolean
}
```

#### 30.2 Behavior Rules

**Inactive state** (`activeActionId === null`):
- Show all primary actions (respecting `hidden` prop)
- No secondary actions visible

**Active state** (`activeActionId === "someId"`):
- Show active primary action as mode indicator (with its `bgClassName`)
- Show separator
- Show its `secondaryActions` (unless `shouldHideSecondaryActions`)
- Hide sibling primary actions (animate out)
- Show `content` if provided (positioned by `contentPosition`)
- Dock container tints based on active action's `bgClassName`

**Clicking a primary action**:
- If not active: Calls `onActionActivate(action.id)` + `action.onClick?.()`
- If already active: Calls `onActionActivate(null)` to deactivate

**Clicking a secondary action**:
- Calls `action.onClick?.()`
- Does NOT auto-deactivate (parent controls via `onActionActivate`)

#### 30.3 Example: ExecutionDock as Unified Dock

```typescript
const executionActions: PrimaryAction[] = [
  {
    id: "prev",
    icon: ChevronLeft,
    secondaryActions: [],
    onClick: onPrevious,
    disabled: isFirstExercise,
  },
  {
    id: "edit",
    icon: Pencil,
    bgClassName: "bg-blue-500 text-white",
    secondaryActions: [
      { id: "cancel", icon: X, label: "Cancel", onClick: onCancelEditing, bgClassName: "bg-background border-2 border-muted-foreground/30" },
      { id: "save", icon: Check, label: "Save", bgClassName: "bg-green-600 text-white", onClick: onSaveEditing },
    ],
    hidden: !isReviewing || !canEdit,
  },
  {
    id: "skip",
    icon: SkipForward,
    secondaryActions: [],
    onClick: onSkip,
    hidden: isReviewing,
  },
  {
    id: "complete",
    icon: Check,
    bgClassName: "bg-green-600 text-white",
    secondaryActions: [],
    onClick: onComplete,
    hidden: isReviewing,
  },
  // ... etc
]

<Dock
  actions={executionActions}
  activeActionId={isEditing ? "edit" : null}
  onActionActivate={(id) => id === "edit" ? handleStartEditing() : handleCancelEditing()}
  statusLabel={`${isEditing ? "Editing" : "Exercise"} ${currentIndex + 1} / ${total}`}
/>
```

#### 30.4 Example: UnifiedModeDock as Unified Dock

```typescript
const builderActions: PrimaryAction[] = [
  {
    id: "select",
    icon: selectedCount > 0 ? CheckSquare : Square,
    secondaryActions: [
      { id: "merge", icon: Link, onClick: onMerge, disabled: selectedCount < 2 },
      { id: "clone", icon: Copy, onClick: onClone },
      { id: "configure", icon: Settings, badge: selectedCount, onClick: onConfigure },
      { id: "delete", icon: Trash2, onClick: onDelete },
    ],
    shouldHideSecondaryActions: selectedCount === 0,
  },
  {
    id: "add",
    icon: Plus,
    bgClassName: "bg-primary text-primary-foreground",
    content: <ExercisePickerContent />,
    contentPosition: "above",
    secondaryActions: [],
  },
  {
    id: "help",
    icon: HelpCircle,
    content: <HelpContent />,
    contentPosition: "above",
    secondaryActions: [],
  },
]

<Dock
  actions={builderActions}
  activeActionId={activeMode}
  onActionActivate={setActiveMode}
/>
```

#### 30.5 Implementation Tasks (Initial)

- [x] **Create `src/components/ui/dock.tsx`** - Unified dock component
- [x] **Type definitions** - Action, PrimaryAction, DockProps types
- [x] **Render logic** - Handle all states (inactive, active, hidden)
- [x] **Animation system** - Framer Motion for expand/collapse/fade
- [x] **Separator component** - Animated vertical divider
- [x] **Content positioning** - Support "above" and "inline" content
- [x] **Badge rendering** - Count badges on action buttons
- [x] **Migrate ExecutionDock** - Refactor to use unified Dock
- [x] **Migrate UnifiedModeDock** - Refactor to use unified Dock
- [ ] **Delete old components** - Remove redundant dock implementations (N/A - both docks still provide domain-specific wrappers)

**Files Created/Modified:**
- `src/components/ui/dock.tsx` - NEW unified component with DockAction, DockPrimaryAction, DockProps types
- `src/components/ui/execution-dock.tsx` - Now wraps Dock with execution-specific action configuration
- `src/components/ui/unified-mode-dock.tsx` - Now wraps Dock with builder-specific action configuration and content panels

#### 30.6 Dock UX Improvements ✅

Based on user feedback, the unified dock needs several UX fixes:

**Visual Issues:**
- [x] **Content inside dock container** - Content panel should be visually part of the dock (single rounded container), not floating above as separate element
- [x] **Unified content position** - Always show content/children ABOVE the dock bar, never inline. Hierarchy: `action → content ABOVE`

**Interaction Issues:**
- [x] **Fix toggle to close** - Clicking active action button should deactivate it (close content)
- [x] **Add backdrop/mask** - When dock has active content:
  - Dim/blur background
  - Prevent clicks on elements behind dock
  - Clicking backdrop closes active action
- [x] **Z-index / nav overlap** - In edit sequence screen, dock is hidden behind bottom navigation. Options:
  - Hide bottom nav in edit sequence screen (preferred - focused task mode)
  - Or adjust dock z-index/position

**Missing Features:**
- [x] **Batch configure with Backpack** - Replace badge-based modifiers with Backpack component (3×1 grid)
- [x] **Single exercise configure with Backpack** - Match batch configure style with Backpack integration
- [x] **Visual feedback for active state** - Add pulse animation to active buttons
- [x] **Light mode contrast** - Add solid background to content panels

**Component Consolidation:**
- [x] **Create reusable content components** - Extract to dock-contents/ directory
- [x] **Refactor SequenceBuilder** - Use Dock directly, remove UnifiedModeDock wrapper
- [x] **Refactor ActionBar** - Create ActionBarDock wrapper using Dock
- [x] **Delete redundant wrappers** - Remove unified-mode-dock.tsx, floating-action-dock.tsx, action-bar.tsx

**Files Created:**
- `src/components/ui/dock-contents/add-exercise-content.tsx`
- `src/components/ui/dock-contents/batch-configure-content.tsx`
- `src/components/ui/dock-contents/help-content.tsx`
- `src/components/ui/dock-contents/index.tsx`
- `src/components/ui/action-bar-dock.tsx`

**Files Modified:**
- `src/components/ui/dock.tsx` - Pulse animation, bg-background content
- `src/components/SequenceBuilder.tsx` - Direct Dock usage, Backpack in configure sheet
- `src/components/ExerciseList.tsx` - Import ActionBarDock
- `src/components/ModifierList.tsx` - Import ActionBarDock
- `src/routes/sequences/index.tsx` - Import ActionBarDock

**Files Deleted:**
- `src/components/ui/unified-mode-dock.tsx`
- `src/components/ui/floating-action-dock.tsx`
- `src/components/action-bar.tsx`

---

### Phase 16.7: Quick Fixes (Checkbox Icons) ✅

Address immediate UX issues in current floating dock:

- [x] **Selection Icon Fix** - Change `Check`/`X` to `Square`/`CheckSquare`
- [x] **Icon Meaning** - Empty square = "enter selection", Checked square = "in selection mode"
- [x] **Consistent Semantics** - Checkbox pattern matches common file manager UX

**Files**: `src/components/ui/floating-action-dock.tsx`

---

### Phase 23: Workout UX Enhancements

Quick fixes and improvements to the workout execution experience.

#### 23.1 Modifier Badges Bug Fix (CRITICAL) ✅

**Problem**: Sequence has `availableModifiers` (e.g., "Guma 25kg", "Guma 15kg") but during workout execution, modifier toggle badges don't appear. The current code only shows modifiers if they're assigned per-exercise (`currentExercise.modifiers`), not sequence-level available modifiers.

**Solution**: Show sequence-level available modifiers for ALL exercises during workout, allowing user to toggle any available modifier on/off dynamically.

- [x] **Fallback to Sequence Modifiers** - If exercise has no assigned modifiers, show all `sequence.availableModifiers`
- [x] **Dynamic Toggle** - User can toggle any available modifier on/off during any exercise
- [x] **Visual Distinction** - Pre-assigned modifiers appear selected by default, available modifiers appear unselected (label changes to "Available Equipment")
- [x] **Effect Colors** - Keep easier (green), harder (red), neutral (blue) color coding + dark mode support

**Files**: `src/routes/sequences/$id/execute.tsx`

#### 23.2 Exercise Name Typography

**Problem**: Exercise name ("Pull up") during workout is small. Users need to see it clearly, especially from a distance during actual workout.

- [ ] **Larger Font Size** - Increase exercise name from `text-2xl` to `text-4xl` or larger
- [ ] **Bold Weight** - Use `font-bold` or `font-extrabold`
- [ ] **Responsive Sizing** - Scale appropriately for mobile vs tablet/desktop
- [ ] **High Contrast** - Ensure visibility in both light and dark modes

**Files**: `src/routes/sequences/$id/execute.tsx`

#### 23.3 Progress Bar Overflow Fix

**Problem**: In elastic goal sequences with time-based exercises, if user goes overtime, the overall progress bar fills too quickly (exceeds 100% for that segment).

- [ ] **Cap Individual Progress** - Limit per-exercise progress contribution to 100%
- [ ] **Overtime Indicator** - Show overtime differently (e.g., pulsing, different color) without breaking total progress
- [ ] **Verify Calculation** - Review `((currentIndex + (isTimeBased ? progress / 100 : 0)) / exercises.length) * 100`

**Files**: `src/routes/sequences/$id/execute.tsx`

#### 23.4 End Sequence Early (Enhanced Quit)

**Problem**: Current quit button immediately exits. User may want confirmation showing what will be saved, or option to go to rating screen.

- [ ] **Quit Confirmation Dialog** - "End workout early? X of Y exercises completed. Progress will be saved."
- [ ] **Options**: "Continue Workout", "Save & Rate", "Discard & Exit"
- [ ] **Save & Rate** - Go directly to completion/rating screen with partial progress

**Files**: `src/routes/sequences/$id/execute.tsx`

---

### Phase 24: Celebration & Statistics Screen

Redesign the workout completion screen with detailed statistics, personal records display, and (later) confetti animation.

#### 24.1 Modified Exercise Tracking (Data Model)

**Problem**: Currently we track exercises generically. User wants to know: "This week I did 250 pullups with 25kg band, 80 pullups with 15kg band, 40 pullups without band, 370 total."

This requires treating exercise+modifier combinations as distinct trackable entities.

**New Data Model Concept**:
```
modifiedExerciseStats {
  id
  userId
  exerciseId          -- FK to exercises
  modifierIds[]       -- Array of modifier IDs used (empty = no modifiers)
  periodStart         -- Aggregation period start
  periodEnd           -- Aggregation period end
  totalReps           -- Sum of repetitions
  totalTime           -- Sum of time (seconds)
  sessionCount        -- Number of workout sessions
  personalBest        -- Best single-set value
  personalBestDate    -- When PB was achieved
}
```

- [ ] **Design Decision** - Aggregate stats vs raw execution data vs both
- [ ] **Schema Update** - Add `exerciseModifierStats` table or extend `sequenceExecutions`
- [ ] **Migration Plan** - How to backfill from existing execution data
- [ ] **Grouping Logic** - Same exercise with different modifiers = different stats
- [ ] **No-Modifier Tracking** - Exercise without any modifier = distinct category

**Files**: `src/db/schema.ts`, new migration file

#### 24.2 Personal Records Redesign

**Problem**: Current PR tracking is basic. User wants detailed PRs per exercise+modifier combination.

**PR Types to Track**:
- Max reps in single set (per exercise+modifier)
- Max time held (per exercise+modifier)
- Most reps in single workout session
- Longest streak (days)
- Weekly/monthly totals

- [ ] **PR Schema Update** - Store PRs with modifier context
- [ ] **PR Detection Logic** - Check for new PRs after each exercise completion
- [ ] **PR History** - Keep history of when PRs were set (not just current best)

**Files**: `src/db/schema.ts`, `src/server/api/routers/executions.ts`

#### 24.3 Completion Screen - Exercise Breakdown

**Problem**: Current completion screen just shows "You completed X exercises (Y skipped)". User wants detailed breakdown.

**Breakdown Display**:
```
Workout Summary (20:23)
━━━━━━━━━━━━━━━━━━━━━━
🏋️ Pull-ups
   • 25kg band: 45 reps (3 sets)
   • 15kg band: 30 reps (2 sets)
   • No band: 12 reps (1 set)

🏋️ Dips
   • No modifier: 60 reps (4 sets)

🏋️ Squats
   • No modifier: 80 reps (2 sets)
━━━━━━━━━━━━━━━━━━━━━━
Total: 227 reps across 6 exercises
```

- [ ] **Group by Exercise** - Aggregate same exercise across sequence
- [ ] **Sub-group by Modifier** - Show modifier variations within each exercise
- [ ] **Duration Display** - Total workout duration prominently shown
- [ ] **Reps vs Time** - Handle both measurement types appropriately

**Files**: `src/routes/sequences/$id/execute.tsx`

#### 24.4 Completion Screen - Personal Records Reveal

**Problem**: User wants excitement when they beat personal records.

**Animated Reveal**:
```
🎉 New Personal Records!
━━━━━━━━━━━━━━━━━━━━━━
[Appears one by one with delay]
🏆 12 pull-ups in one set (was 10)
🏆 60 squats in workout (was 55)
🏆 First time doing dips with 10kg!
━━━━━━━━━━━━━━━━━━━━━━
[Skip] button to show all immediately
```

- [ ] **PR Comparison** - Compare workout results to stored PRs
- [ ] **New PR Detection** - Identify which records were broken
- [ ] **Animated List** - Records appear one-by-one (500ms delay each)
- [ ] **Skip Button** - Show all records immediately
- [ ] **First-Time Badges** - "First time doing X with Y modifier!"

**Files**: `src/routes/sequences/$id/execute.tsx`, new component `PRReveal.tsx`

#### 24.5 Confetti Animation (Future Enhancement)

- [ ] **Confetti Library** - Add canvas-confetti or similar
- [ ] **Trigger Conditions** - On workout complete, on new PR
- [ ] **Accessibility** - Respect `prefers-reduced-motion`
- [ ] **Performance** - Don't block UI during animation

**Files**: `src/routes/sequences/$id/execute.tsx`, `package.json`

---

### Phase 25: Time-Constrained Workouts ("Finish Before")

Feature for users who need to finish by a specific time (e.g., catch a bus at 10:00).

#### 25.1 Data Model

- [ ] **Sequence Setting** - Add `finishByEnabled: boolean`, `finishByTime: string` (HH:mm), `warningMinutes: number` to sequence schema
- [ ] **Per-Session Override** - Allow setting finish time when starting workout (not just in sequence settings)

**Files**: `src/db/schema.ts`, migration

#### 25.2 UI - Settings

- [ ] **Sequence Details Tab** - Add "Finish Before" section with time picker and warning threshold
- [ ] **Start Workout Dialog** - Optional "I need to finish by..." quick setting
- [ ] **Default Warning** - 5 minutes before deadline

**Files**: `src/components/SequenceBuilder.tsx` (Details tab), `src/routes/sequences/$id/execute.tsx`

#### 25.3 UI - Countdown Display

```
┌─────────────────────────────────┐
│  ⏰ 4:32 remaining              │  <- Appears when warning threshold reached
│  Need to finish by 10:00        │
└─────────────────────────────────┘
```

- [ ] **Countdown Timer** - Shows when `currentTime >= finishByTime - warningMinutes`
- [ ] **Visual Style** - Non-intrusive but visible (top banner or floating badge)
- [ ] **Color Coding** - Yellow (>2min left), Orange (1-2min), Red (<1min)
- [ ] **No Sound** - Visual only, no alarms (user specifically requested this)
- [ ] **Auto-Hide** - Disappears if user completes early

**Files**: `src/routes/sequences/$id/execute.tsx`, new component `FinishByTimer.tsx`

---

### Phase 26: Inline Exercise Creation During Workout

Allow creating new exercises without leaving the workout screen.

#### 26.1 Exercise Picker Enhancement

Current: Exercise picker shows existing exercises only.
New: Add "Create New Exercise" option at top/bottom of picker.

- [ ] **Create New Button** - Prominent button in exercise picker drawer
- [ ] **Inline Form** - Minimal form (name required, description optional)
- [ ] **Quick Create** - Create exercise and immediately add to current workout
- [ ] **Full Details Later** - User can add details (photos, videos, tips) after workout

**Files**: `src/components/exercise-picker-drawer.tsx`

#### 26.2 Temporary Exercise Support

- [ ] **Create via tRPC** - Use existing `exercises.create` mutation
- [ ] **Auto-Add to Workout** - After creation, automatically add to current position
- [ ] **Save Prompt** - After workout, ask if new exercises should be added to sequence permanently

**Files**: `src/components/exercise-picker-drawer.tsx`, `src/routes/sequences/$id/execute.tsx`

---

### Phase 27: Advanced Modifier Units (Compound Units)

Support for custom compound units like "tiles + stripes" for micro-progression tracking.

#### 27.1 Data Model

**Current**: Modifiers have `unit: 'kg' | 'cm' | 'lbs' | 'inches' | 'level' | 'none'`

**New**: Support compound units with sub-units:
```typescript
type CompoundUnit = {
  unitName: string           // e.g., "stripped tile"
  subUnitCount: number       // e.g., 7 (each tile has 7 stripes)
  subUnitName: string        // e.g., "stripe"
}
```

Example: "4 tiles, 3 stripes" = 4 * 7 + 3 = 31 stripes total (for comparison/progress)

- [ ] **Schema Update** - Add `compoundUnit` JSONB field to modifiers table
- [ ] **Unit Type** - Add 'compound' to unit enum
- [ ] **Value Storage** - Store as `{main: number, sub: number}` or total sub-units

**Files**: `src/db/schema.ts`, `src/db/types.ts`

#### 27.2 Modifier Form Update

- [ ] **Compound Unit Toggle** - Switch between simple and compound unit
- [ ] **Custom Fields** - Unit name, sub-unit count, sub-unit name inputs
- [ ] **Preview** - Show how values will display (e.g., "4 tiles, 3/7 stripes")

**Files**: `src/components/modifiers/ModifierForm.tsx`

#### 27.3 Dual Wheel Input

For compound unit modifiers during workout, show two wheels:

```
┌─────────────────────────┐
│   [3]        [5]        │
│  tiles    stripes/7     │
└─────────────────────────┘
```

- [ ] **Dual Wheel Component** - Two synchronized number wheels
- [ ] **Sub-Unit Limit** - Second wheel max = subUnitCount - 1
- [ ] **Overflow Handling** - 7 stripes → 1 tile, 0 stripes
- [ ] **Display Format** - "3 tiles, 5 stripes" or "3.5 tiles" (configurable)

**Files**: `src/components/ui/compound-wheel-input.tsx` (new), integration in execution screen

#### 27.4 Progress Tracking

- [ ] **Comparison Logic** - Convert to total sub-units for progress comparison
- [ ] **PR Detection** - Detect when user reaches new tile/stripe combination
- [ ] **History Display** - Show progression over time (e.g., "3 tiles → 4 tiles in 2 months")

**Files**: `src/server/api/routers/executions.ts`

---

### Phase 28: Backpack Compound Component System

Game-style equipment management primitives using compound component pattern (like Radix/shadcn).

**Component Created**: `src/components/ui/backpack/`

#### 28.1 Core Components (Implemented)

- [x] **Backpack.Root** - Context provider with controlled/uncontrolled state management
- [x] **Backpack.Container** - Visual backpack wrapper with themes (brown, gray, dark)
- [x] **Backpack.Grid** - Grid layout with configurable cols/rows
- [x] **Backpack.Slot** - Individual inventory slot with effect-based styling
- [x] **Backpack.ItemContent** - Item display with badge and effect indicator
- [x] **Backpack.EmptySlot** - Empty slot placeholder
- [x] **Backpack.AddButton** - Add new item button
- [x] **Backpack.Label** - Helper text below backpack

#### 28.2 Effect System (Implemented)

- [x] **BackpackEffect type** - `"easier" | "harder" | "neutral" | null`
- [x] **Effect cycling** - Click to cycle: off → easier → harder → off
- [x] **Visual indicators** - Green (easier ↓), Red (harder ↑), Blue (neutral •)
- [x] **Badge labels** - E (easier), H (harder), N (neutral)

#### 28.3 State Management (Implemented)

- [x] **Controlled mode** - External `value` and `onChange` props
- [x] **Uncontrolled mode** - Internal state with initial values
- [x] **Context hook** - `useBackpackContext()` for custom components

#### 28.4 Future Enhancements

- [ ] **Drag & Drop** - Reorder items within backpack using dnd-kit
- [ ] **Trash Zone** - Drag items to trash zone to remove
- [ ] **Multiple Backpacks** - Sync items between backpacks (e.g., sequence vs exercise)
- [ ] **Item Drawer** - Slide-up drawer for adding new items from library
- [ ] **Animation** - Spring animations for add/remove/toggle interactions
- [ ] **Sound Effects** - Optional audio feedback for game feel

#### 28.5 Usage Example

```tsx
import { Backpack } from "@/components/ui/backpack"

<Backpack.Root
  items={equipmentItems}
  value={activeItems}
  onChange={setActiveItems}
  cols={3}
  rows={1}
  editable={true}
  onToggle={(id, effect) => console.log(`Item ${id} set to ${effect}`)}
>
  <Backpack.Container theme="brown">
    <Backpack.Grid>
      {items.map((item) => (
        <Backpack.Slot key={item.id} item={item}>
          <Backpack.ItemContent item={item} />
        </Backpack.Slot>
      ))}
      <Backpack.AddButton onClick={handleAddNew} />
      <Backpack.EmptySlot />
    </Backpack.Grid>
  </Backpack.Container>
  <Backpack.Label />
</Backpack.Root>
```

**Files**:
- `src/components/ui/backpack/backpack.tsx` - Main component file
- `src/components/ui/backpack/index.ts` - Exports

---

### Phase 29: Game-Style UI Components

Collection of game-inspired UI components for workout execution.

#### 29.1 Components Created

- [x] **GameTimer** - Digital clock-style timer with minute:second wheels
  - Themes: emerald, orange, blue
  - Editable mode with wheel inputs
  - Display-only mode with static numbers
  - File: `src/components/ui/game-timer.tsx`

- [x] **GameCounter** - Arcade scoreboard-style rep counter
  - Themes: lime, orange, cyan
  - Target indicator with completion checkmark
  - Wheel input for value adjustment
  - File: `src/components/ui/game-counter.tsx`

- [x] **EquipmentGrid** - Backpack inventory grid
  - Configurable rows/cols
  - Effect cycling (easier/harder/off)
  - Add button support
  - File: `src/components/ui/equipment-grid.tsx`

#### 29.2 Integration (Implemented)

- [x] **Execute Screen** - Integrated game components into workout execution
- [x] **Layout** - Equipment (left) | Timer/Counter (right) on desktop
- [x] **Mobile** - Stacked layout with timer/counter on top
- [x] **Theme Switching** - Dynamic theme based on workout state

#### 29.3 Future Enhancements

- [ ] **Sound Effects** - Game-style beeps and completion sounds
- [ ] **Particle Effects** - Confetti on PR, sparkles on completion
- [ ] **Achievement Badges** - Pop-up badges during workout
- [ ] **Combo Counter** - Track consecutive successful exercises

**Files**:
- `src/components/ui/game-timer.tsx`
- `src/components/ui/game-counter.tsx`
- `src/components/ui/equipment-grid.tsx`
- `src/routes/sequences/$id/execute.tsx` (integration)

---

## Notes

- All user data is scoped by `userId` for privacy
- Soft deletes are used (filter by `deletedAt`)
- tRPC provides end-to-end type safety
- TanStack Query handles caching and invalidation
- better-auth handles authentication
