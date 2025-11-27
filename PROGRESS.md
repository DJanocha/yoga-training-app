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
- [ ] **Fixed Bottom Position** - Dock floats at bottom of screen (above navigation) like iOS/macOS dock
- [ ] **Backdrop Blur Effect** - Semi-transparent background with `backdrop-filter: blur(12px)`
- [ ] **Circular Icon Buttons** - Replace rectangular buttons with circular icon buttons
- [ ] **Spring Animations** - Use Framer Motion with spring physics for expand/collapse
- [ ] **Separator Lines** - Animated vertical dividers between action groups

#### 16.2 Icon-based Action Design
Primary actions (always visible):
- [ ] **Select** - ✓ icon (checkmark) - Toggles selection mode
- [ ] **Add** - + icon (plus) - Opens ExercisePickerDrawer with exercises AND breaks

Selection actions (appear when items selected):
- [ ] **Merge** - ⛓️ icon (link/chain) - Merge selected into group
- [ ] **Clone** - 📋 icon (clipboard) - Duplicate selected items
- [ ] **Configure** - ⚙️ icon (gear) - Configure selected items with badge count (e.g., "2")
- [ ] **Delete** - 🗑️ icon (trash) - Delete selected items

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

- [ ] **Smooth Expansion** - Dock expands left-to-right when entering selection mode
- [ ] **Icon Animations** - Icons scale up on hover/press (1.1x)
- [ ] **Badge Count** - Show selected count on Configure button
- [ ] **Disabled States** - Gray out unavailable actions (e.g., Merge when < 2 selected)

#### 16.4 Break as Special Exercise
- [ ] **Break in Exercise List** - Add "Break" as a special item at the TOP of ExercisePickerDrawer list
- [ ] **Visual Distinction** - Style break with Coffee icon (☕), different background color (e.g., blue-50)
- [ ] **Default Config** - Breaks default to 30 seconds (time-based)
- [ ] **Simplified Add** - Remove separate "Add Break" button, unify into single "Add" action

#### 16.5 Enhanced Interactions
- [ ] **Click Outside to Cancel** - Clicking outside dock or list exits selection mode
- [ ] **Keyboard Shortcuts** - Esc to cancel selection, Delete key for delete action
- [ ] **Touch-friendly** - Larger touch targets (48px minimum) for mobile
- [ ] **Haptic Feedback** - Vibration on action button press (if enabled in settings)
- [ ] **Visual Feedback** - Active state glow/highlight on pressed buttons

#### 16.6 Visual Polish
- [ ] **Gradient Background** - Subtle gradient in dock background
- [ ] **Shadow/Elevation** - Depth with `box-shadow` to lift dock above content
- [ ] **Hover Effects** - Tooltip labels appear above icons on hover
- [ ] **Smooth Transitions** - All state changes use spring animations (stiffness: 300, damping: 30)
- [ ] **Reduced Motion** - Respect `prefers-reduced-motion` for accessibility

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
- [ ] **Group rename input triggers zoom** - Input has `text-sm` (14px) which triggers iOS Safari auto-zoom on focus
- [ ] **Zoom persists after editing** - After accepting rename, viewport stays zoomed in requiring manual zoom-out
- [ ] **Fix**: Change input font-size to minimum 16px (`text-base`) to prevent iOS zoom

**Files**: `src/components/SequenceBuilder.tsx` (SortableGroupItem component, line ~352)

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
- [ ] **File**: `src/components/ui/segmented-progress.tsx`
- [ ] **Props**: `exercises`, `completedExercises`, `currentIndex`, `onNavigate`
- [ ] **Segment Rendering** - Map exercises to colored segments based on completion status
- [ ] **Tappable Segments** - Click/tap any segment to navigate to that exercise
- [ ] **Arrow Buttons** - Left/right arrows at ends for explicit navigation
- [ ] **Current Position Marker** - Blue indicator arrow pointing at current exercise
- [ ] **Responsive Sizing** - Segments shrink on mobile for long sequences (min 8px width)
- [ ] **Overflow Handling** - Horizontal scroll for very long sequences (>20 exercises)

**State Changes in `execute.tsx`**:
- [ ] **Add `viewingIndex`** - Separate from `currentIndex` to allow reviewing past exercises
- [ ] **Add `isReviewing` mode** - Boolean flag for review vs execution mode
- [ ] **Review Mode Behavior**:
  - Timer paused when reviewing
  - Show exercise details but grayed out controls
  - "Resume" button to return to `currentIndex`
  - "Redo" button to reset exercise and continue from there
- [ ] **Navigation Handler** - `handleNavigate(targetIndex)`:
  - If `targetIndex < currentIndex`: Enter review mode
  - If `targetIndex === currentIndex`: Exit review mode
  - If `targetIndex > currentIndex`: Not allowed (can't skip ahead)

**Review Mode UI**:
- [ ] **Dimmed Overlay** - 50% opacity overlay on main content
- [ ] **Review Banner** - "Reviewing Exercise 3 of 10" with Resume/Redo buttons
- [ ] **Exercise Summary** - Show recorded value, time spent, modifiers used
- [ ] **Redo Confirmation** - Dialog: "Redo this exercise? Previous result will be discarded."

**Redo Logic**:
- [ ] **Remove from completedExercises** - Pop all exercises from target index onwards
- [ ] **Reset state** - `setCurrentIndex(targetIndex)`, `setTimeElapsed(0)`, `setActualValue(targetValue)`
- [ ] **Exit review mode** - `setIsReviewing(false)`, `setViewingIndex(null)`

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
- [ ] **Import WheelNumberInput** - From `@/components/ui/wheel-number-input`
- [ ] **Replace +/- buttons with wheel**:
```tsx
<WheelNumberInput
  value={actualValue}
  onChange={setActualValue}
  min={1}
  max={measure === 'time' ? 300 : 100}
  step={measure === 'time' ? 5 : 1}
/>
```
- [ ] **Conditional Step Size**:
  - Time-based: step=5 (5s increments for easier scrolling)
  - Rep-based: step=1 (precise rep counting)
- [ ] **Larger Display** - Increase wheel height for execution context (h-48 vs h-32)
- [ ] **Touch-Friendly Sizing** - Minimum 48px touch targets

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
- [ ] **File**: `src/components/exercise-config-update-dialog.tsx`
- [ ] **Props**: `exercise`, `oldConfig`, `newConfig`, `sequence`, `onApply`, `onCancel`

**Matching Logic** (find similar exercises):
```typescript
type UpdateScope =
  | 'this-only'           // Just this occurrence
  | 'same-group'          // All in same group (if grouped)
  | 'all-in-sequence'     // All occurrences of this exercise in sequence
  | 'same-config'         // All with identical config (e.g., all "10s push-ups")

function findMatchingExercises(
  exercises: SequenceExercise[],
  targetExercise: SequenceExercise,
  scope: UpdateScope,
  groups?: ExerciseGroup[]
): number[] // Returns indices to update
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
- [ ] **Match Counter** - Show count for each option (e.g., "3 matches")
- [ ] **Preview List** - Expandable list showing which exercises will be affected
- [ ] **Radio Selection** - Single choice from scope options
- [ ] **Persistence Checkbox** - "Save changes permanently to sequence"
- [ ] **Apply Handler**:
  - Update `workoutExercises` state for session changes
  - If persist checked: call `updateSequence.mutate()` with modified exercises
  - Show toast: "Updated X exercises"

**State Updates**:
- [ ] **Add `pendingConfigChange`** - Track when config change is in progress
- [ ] **Add `showConfigDialog`** - Boolean to show/hide dialog
- [ ] **Update workoutExercises** - Modify multiple indices in array

**Edge Cases**:
- [ ] **Already completed exercises** - Only update future occurrences, not completed ones
- [ ] **Group integrity** - If updating group members, maintain group structure
- [ ] **Undo support** - Store previous state for potential undo

---

#### 18.4 Integration & Polish

**Progress Bar Integration**:
- [ ] **Replace Progress component** - Swap `<Progress>` with `<SegmentedProgressBar>`
- [ ] **Header layout update** - Move progress bar below header, add arrow buttons
- [ ] **Animation** - Smooth transitions when segments change color

**Wheel Integration**:
- [ ] **Conditional rendering** - Show wheel only for rep-based exercises (time uses countdown)
- [ ] **Layout adjustment** - Center wheel in main content area
- [ ] **Visual feedback** - Highlight wheel when value differs from target

**Config Dialog Integration**:
- [ ] **Trigger button** - Add "Edit" button near exercise name during execution
- [ ] **Auto-trigger** - Optionally trigger when measure type changes
- [ ] **Keyboard support** - Escape to cancel, Enter to apply

**Accessibility**:
- [ ] **ARIA labels** - All interactive elements have proper labels
- [ ] **Focus management** - Focus moves logically through components
- [ ] **Screen reader** - Announce navigation changes and config updates

---

#### 18.5 Files to Modify

| File | Changes |
|------|---------|
| `src/routes/sequences/$id/execute.tsx` | Add viewingIndex, isReviewing state; replace Progress with SegmentedProgressBar; replace +/- with wheel; add config edit trigger |
| `src/components/ui/segmented-progress.tsx` | NEW - Segmented progress bar component |
| `src/components/exercise-config-update-dialog.tsx` | NEW - Bulk config update dialog |
| `src/components/ui/wheel-number-input.tsx` | Add size variant prop for larger execution display |
| `src/db/types.ts` | Add UpdateScope type if needed |

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

- [ ] **Add position wheel** - Third `WheelSelect` with options: "before", "after"
- [ ] **Default to "after"** - Preserves existing behavior
- [ ] **Dynamic description** - Update text: "Select an exercise to add {before/after} the current one"
- [ ] **Update insert logic** - `insertIndex = position === 'before' ? currentIndex : currentIndex + 1`
- [ ] **Pass position to handler** - Update `handleExerciseSelected` signature to include position

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

- [ ] **Enable group selection** - Allow selecting groups in addition to exercises
- [ ] **Visual selection state** - Show selected state on group cards (border highlight, checkbox)
- [ ] **Mixed selection** - Support selecting groups + standalone exercises together
- [ ] **Selection count** - Badge shows total exercise count (flattened), not item count

#### 19.2 Batch Operations on Groups

- [ ] **Batch configure with groups** - Configure selection applies to all exercises inside selected groups
- [ ] **Flatten logic** - `getEffectiveSelection(selectedIds, groups, exercises)` returns exercise IDs
- [ ] **Merge mixed selection** - Merge groups + exercises into new group (name = first group name or first exercise name)
- [ ] **Clone mixed selection** - Duplicate all selected (groups stay as groups, exercises stay as exercises)

#### 19.3 Delete Group Action

Currently missing - can only ungroup, not delete group with its exercises.

- [ ] **Add delete group button** - Place next to clone/ungroup buttons in group header
- [ ] **Confirmation dialog** - "Delete group and X exercises?"
- [ ] **Batch delete** - When groups selected, delete removes groups + all their exercises

#### 19.4 Group Header Actions

Current: `[Clone] [Ungroup]`
New: `[Clone] [Ungroup] [Delete]`

```
┌─────────────────────────────────────────────────────┐
│  ⋮⋮  ∨  Morning Set    [3]    [📋] [⛓️‍💥] [🗑️]     │
│         ↑ collapse      count  clone ungroup delete │
└─────────────────────────────────────────────────────┘
```

- [ ] **Delete button** - Trash icon, red on hover
- [ ] **Confirmation** - Alert dialog before deleting

**Files**: `src/components/SequenceBuilder.tsx`

---

### Phase 20: Default Exercise Configuration

Add sequence-level default config so new exercises inherit sensible defaults instead of always 30s.

#### 20.1 Use Case

| Sequence Type | Ideal Default |
|---------------|---------------|
| Yoga/Stretching | 60s (holds) |
| Calisthenics | 10x (reps) |
| HIIT/Cardio | 30s (intervals) |
| Strength | 5x (heavy reps) |

Currently all new exercises default to 30s regardless of sequence type.

#### 20.2 Schema Changes

Add to sequences table:
```typescript
defaultExerciseConfig: {
  measure: 'time' | 'repetitions'
  targetValue: number
}
```

- [ ] **Add schema field** - `defaultExerciseConfig` JSONB column in sequences table
- [ ] **Migration** - Generate and apply Drizzle migration
- [ ] **Default value** - `{ measure: 'time', targetValue: 30 }` for backwards compatibility
- [ ] **Zod schema** - Add to `refinedSequenceSchema`

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

- [ ] **Add wheels to Details tab** - Value + Unit wheels under Goal Type
- [ ] **Label** - "Default Exercise Config" with helper text
- [ ] **Save with sequence** - Include in update mutation

#### 20.4 Apply Defaults

- [ ] **Exercise picker uses defaults** - Initialize wheels with `sequence.defaultExerciseConfig`
- [ ] **Fallback** - If no default set, use `{ measure: 'time', targetValue: 30 }`
- [ ] **Add Break exception** - Breaks always default to 30s time regardless of sequence default

**Files**:
- `src/db/schema.ts` - Add column
- `src/db/types.ts` - Add type
- `src/components/SequenceBuilder.tsx` - Details tab UI
- `src/components/exercise-picker-drawer.tsx` - Use defaults
- `src/validators/api/sequences.ts` - Update validators

---

## Notes

- All user data is scoped by `userId` for privacy
- Soft deletes are used (filter by `deletedAt`)
- tRPC provides end-to-end type safety
- TanStack Query handles caching and invalidation
- better-auth handles authentication
