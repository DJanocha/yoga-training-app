# YogaFlow Database Schema

This document describes the database schema, relationships, and data structures used in the YogaFlow application.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    AUTHENTICATION                                        │
│                                   (better-auth)                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│    user      │     │   session    │     │   account    │     │  verification    │
├──────────────┤     ├──────────────┤     ├──────────────┤     ├──────────────────┤
│ id (PK)      │◄────┤ userId (FK)  │     │ userId (FK)  │────►│ identifier       │
│ name         │     │ token        │     │ provider     │     │ value            │
│ email        │     │ expiresAt    │     │ providerId   │     │ expiresAt        │
│ emailVerified│     │ ipAddress    │     │ accessToken  │     │ createdAt        │
│ image        │     │ userAgent    │     │ refreshToken │     │ updatedAt        │
│ createdAt    │     │ createdAt    │     │ createdAt    │     └──────────────────┘
│ updatedAt    │     │ updatedAt    │     │ updatedAt    │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       │ 1:N relationships
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    APPLICATION DATA                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌────────────────────────┐
│    exercises     │     │    sequences     │     │  sequence_executions   │
├──────────────────┤     ├──────────────────┤     ├────────────────────────┤
│ id (PK)          │     │ id (PK)          │◄────┤ sequenceId (FK)        │
│ userId (FK)──────┼────►│ userId (FK)──────┼────►│ userId (FK)            │
│ name             │     │ name             │     │ id (PK)                │
│ description      │     │ description      │     │ startedAt              │
│ tips             │     │ level            │     │ completedAt            │
│ modifications[]  │     │ category         │     │ exercises (JSONB)      │
│ level            │     │ exercises (JSONB)│     │ pausedAt               │
│ category         │     │ isFavorite       │     │ totalPauseDuration     │
│ bodyParts[]      │     │ isPreBuilt       │     │ rating                 │
│ photoUrls[]      │     │ deletedAt        │     │ feedback               │
│ videoUrls[]      │     │ createdAt        │     │ personalRecords (JSONB)│
│ links[]          │     └──────────────────┘     │ createdAt              │
│ isPreBuilt       │                              └────────────────────────┘
│ deletedAt        │
│ createdAt        │
└──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│  user_settings   │     │   achievements   │
├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │
│ userId (FK,UQ)───┼────►│ userId (FK)──────┤
│ userName         │     │ badgeId          │
│ beepEnabled      │     │ unlockedAt       │
│ beepStartSeconds │     │ category         │
│ level            │     │ metadata (JSONB) │
│ focusArea        │     │ createdAt        │
│ hapticEnabled    │     └──────────────────┘
│ contrastMode     │
│ weeklyGoal       │
│ theme            │
│ currentStreak    │
│ longestStreak    │
│ lastWorkoutDate  │
│ badges[]         │
│ createdAt        │
└──────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PLANNED: MODIFIERS SYSTEM                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│    modifiers     │  (NEW TABLE)
├──────────────────┤
│ id (PK)          │
│ userId (FK)──────┼────► user.id
│ name             │     "Band 15kg", "Yoga Block 20cm"
│ unit             │     'kg' | 'lbs' | 'cm' | 'inches' | 'level' | 'none'
│ value            │     numeric value (nullable)
│ description      │
│ deletedAt        │
│ createdAt        │
└──────────────────┘

sequences table additions:
  + goal: TEXT           'strict' | 'elastic' (moved from per-exercise)
  + availableModifiers: JSONB   Array<{ modifierId: number }>
```

---

## Table Details

### Authentication Tables (better-auth)

These tables are managed by better-auth and defined in `src/db/auth-schema.ts`.

| Table | Purpose |
|-------|---------|
| `user` | User accounts with email, name, avatar |
| `session` | Active user sessions with tokens |
| `account` | OAuth provider connections |
| `verification` | Email verification tokens |

---

### `exercises`

Stores user-created exercises with media and metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `userId` | TEXT | FK to user.id (CASCADE) |
| `name` | TEXT | Exercise name (required) |
| `description` | TEXT | Detailed description |
| `tips` | TEXT | Usage tips |
| `modifications` | TEXT[] | Variation descriptions |
| `level` | TEXT | 'beginner' \| 'intermediate' \| 'advanced' |
| `category` | TEXT | 'yoga' \| 'calisthenics' \| 'cardio' \| 'flexibility' \| 'strength' |
| `bodyParts` | TEXT[] | Target body parts |
| `photoUrls` | TEXT[] | External photo URLs |
| `videoUrls` | TEXT[] | External video URLs |
| `links` | TEXT[] | Resource links |
| `isPreBuilt` | BOOLEAN | System-provided exercise |
| `deletedAt` | TIMESTAMP | Soft delete marker |
| `createdAt` | TIMESTAMP | Creation timestamp |

**Indexes:**
- `exercises_user_id_idx` on (userId)
- `exercises_level_idx` on (userId, level)
- `exercises_category_idx` on (userId, category)

---

### `sequences`

Stores workout sequences with ordered exercises.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `userId` | TEXT | FK to user.id (CASCADE) |
| `name` | TEXT | Sequence name (required) |
| `description` | TEXT | Sequence description |
| `level` | TEXT | Difficulty level |
| `category` | TEXT | Workout category |
| `exercises` | JSONB | Ordered exercise list (see below) |
| `isFavorite` | BOOLEAN | Favorited by user |
| `isPreBuilt` | BOOLEAN | System-provided sequence |
| `deletedAt` | TIMESTAMP | Soft delete marker |
| `createdAt` | TIMESTAMP | Creation timestamp |

**Planned additions:**
- `goal` TEXT - 'strict' \| 'elastic' (sequence-level)
- `availableModifiers` JSONB - Available modifier IDs

**Indexes:**
- `sequences_user_id_idx` on (userId)
- `sequences_favorite_idx` on (userId, isFavorite)

#### `exercises` JSONB Structure (Current)

```typescript
type SequenceExercise = {
  exerciseId: number | 'break'  // Reference to exercises.id or break marker
  config: {
    goal: 'strict' | 'elastic'  // Will move to sequence level
    measure: 'repetitions' | 'time'
    targetValue?: number        // Reps count or seconds
  }
}

// Example:
[
  { exerciseId: 1, config: { goal: 'strict', measure: 'time', targetValue: 30 } },
  { exerciseId: 'break', config: { goal: 'strict', measure: 'time', targetValue: 10 } },
  { exerciseId: 2, config: { goal: 'elastic', measure: 'repetitions', targetValue: 15 } }
]
```

#### `exercises` JSONB Structure (Planned with Modifiers)

```typescript
type SequenceExercise = {
  exerciseId: number | 'break'
  config: {
    measure: 'repetitions' | 'time'
    targetValue?: number
    modifiers?: Array<{
      modifierId: number
      effect: 'easier' | 'harder' | 'neutral'
    }>
  }
}
```

---

### `sequence_executions`

Tracks completed workout sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `userId` | TEXT | FK to user.id (CASCADE) |
| `sequenceId` | INTEGER | FK to sequences.id (CASCADE) |
| `startedAt` | TIMESTAMP | Workout start time |
| `completedAt` | TIMESTAMP | Workout end time |
| `exercises` | JSONB | Completed exercises (see below) |
| `pausedAt` | TIMESTAMP | Current pause start |
| `totalPauseDuration` | INTEGER | Total pause time (ms) |
| `rating` | INTEGER | 1-5 rating |
| `feedback` | TEXT | User feedback |
| `personalRecords` | JSONB | PRs achieved (see below) |
| `createdAt` | TIMESTAMP | Creation timestamp |

**Indexes:**
- `executions_user_id_idx` on (userId)
- `executions_sequence_id_idx` on (sequenceId)

#### `exercises` JSONB Structure (Current)

```typescript
type CompletedExercise = {
  exerciseId: number | 'break'
  startedAt: Date
  completedAt?: Date
  value?: number           // Actual reps/seconds completed
  skipped?: boolean
}
```

#### `exercises` JSONB Structure (Planned with Modifiers)

```typescript
type CompletedExercise = {
  exerciseId: number | 'break'
  setNumber: number        // 1 = first set, 2+ = added sets
  startedAt: Date
  completedAt?: Date
  value?: number
  skipped?: boolean
  activeModifiers?: Array<{
    modifierId: number
    effect: 'easier' | 'harder' | 'neutral'
  }>
}
```

#### `personalRecords` JSONB Structure (Current)

```typescript
type PersonalRecord = {
  exerciseId: number
  type: 'repetitions' | 'time'
  previousBest?: number
  newBest: number
}
```

#### `personalRecords` JSONB Structure (Planned with Modifiers)

```typescript
type PersonalRecord = {
  exerciseId: number
  type: 'repetitions' | 'time'
  previousBest?: number
  newBest: number
  modifierSignature?: string  // e.g., "15-easier|22-harder" or null
  modifierIds?: number[]      // For display lookup
}
```

---

### `user_settings`

User preferences and tracking data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `userId` | TEXT | FK to user.id (CASCADE, UNIQUE) |
| `userName` | TEXT | Display name |
| `beepEnabled` | BOOLEAN | Audio countdown |
| `beepStartSeconds` | INTEGER | When to start beeping (0-10) |
| `level` | TEXT | User fitness level |
| `focusArea` | TEXT | Primary workout focus |
| `hapticEnabled` | BOOLEAN | Vibration feedback |
| `contrastMode` | BOOLEAN | High contrast UI |
| `weeklyGoal` | INTEGER | Workouts per week target |
| `theme` | TEXT | 'energy' \| 'zen' |
| `currentStreak` | INTEGER | Current workout streak |
| `longestStreak` | INTEGER | Best streak achieved |
| `lastWorkoutDate` | TIMESTAMP | Most recent workout |
| `badges` | TEXT[] | Earned badge IDs |
| `createdAt` | TIMESTAMP | Creation timestamp |

**Indexes:**
- `settings_user_id_idx` on (userId)

---

### `achievements`

Tracks unlocked badges and milestones.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `userId` | TEXT | FK to user.id (CASCADE) |
| `badgeId` | TEXT | Unique badge identifier |
| `unlockedAt` | TIMESTAMP | When badge was earned |
| `category` | TEXT | 'milestone' \| 'streak' \| 'personal-record' \| 'consistency' |
| `metadata` | JSONB | Additional data (see below) |
| `createdAt` | TIMESTAMP | Creation timestamp |

**Indexes:**
- `achievements_user_id_idx` on (userId)
- `achievements_category_idx` on (userId, category)

#### `metadata` JSONB Structure

```typescript
type AchievementMetadata = {
  value?: number           // e.g., 25 for "25 push-ups"
  exerciseName?: string    // e.g., "Push-ups" for PR badges
}
```

---

### `modifiers` (PLANNED)

Global equipment/modifier library.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `userId` | TEXT | FK to user.id (CASCADE) |
| `name` | TEXT | Modifier name (e.g., "Band 15kg") |
| `unit` | TEXT | 'kg' \| 'lbs' \| 'cm' \| 'inches' \| 'level' \| 'none' |
| `value` | REAL | Numeric value (nullable) |
| `description` | TEXT | Optional description |
| `deletedAt` | TIMESTAMP | Soft delete marker |
| `createdAt` | TIMESTAMP | Creation timestamp |

**Planned Indexes:**
- `modifiers_user_id_idx` on (userId)
- `modifiers_name_idx` on (userId, name)

---

## Relationships Summary

```
user (1) ──────┬────────── (N) exercises
               │
               ├────────── (N) sequences
               │                    │
               │                    └──── (N) sequence_executions
               │
               ├────────── (1) user_settings
               │
               ├────────── (N) achievements
               │
               └────────── (N) modifiers (PLANNED)
```

---

## Data Flow Diagrams

### Workout Execution Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐
│  sequences  │────►│  Start      │────►│ sequence_executions │
│             │     │  Workout    │     │   (new record)      │
└─────────────┘     └─────────────┘     └──────────┬──────────┘
                                                   │
                    ┌─────────────┐                │
                    │  Exercise   │◄───────────────┤
                    │  Completed  │                │
                    └──────┬──────┘                │
                           │                       │
                    ┌──────▼──────┐                │
                    │   Update    │────────────────┤
                    │  exercises  │                │
                    │   JSONB     │                │
                    └─────────────┘                │
                                                   │
                    ┌─────────────┐                │
                    │  Workout    │◄───────────────┤
                    │  Complete   │                │
                    └──────┬──────┘                │
                           │                       │
              ┌────────────┼────────────┐          │
              ▼            ▼            ▼          │
        ┌──────────┐ ┌──────────┐ ┌──────────┐    │
        │  Submit  │ │  Detect  │ │  Update  │    │
        │  Rating  │ │   PRs    │ │  Streak  │    │
        └──────────┘ └────┬─────┘ └──────────┘    │
                          │                       │
                          ▼                       │
                    ┌─────────────┐               │
                    │achievements │               │
                    │ (new PRs)   │               │
                    └─────────────┘               │
```

### Modifier Assignment Flow (PLANNED)

```
┌─────────────┐
│  modifiers  │ ◄─── User creates "Band 15kg", "Block 20cm"
│  (library)  │
└──────┬──────┘
       │
       │ Select for sequence
       ▼
┌─────────────────────────────────────┐
│            sequences                 │
│  availableModifiers: [              │
│    { modifierId: 1 },  // Band 15kg │
│    { modifierId: 2 }   // Block 20cm│
│  ]                                   │
└──────────────┬──────────────────────┘
               │
               │ Assign per exercise
               ▼
┌─────────────────────────────────────┐
│  sequences.exercises[0].config      │
│  modifiers: [                        │
│    { modifierId: 1, effect: 'easier'}│
│  ]                                   │
└──────────────┬──────────────────────┘
               │
               │ Toggle during workout
               ▼
┌─────────────────────────────────────┐
│  sequence_executions.exercises[0]   │
│  activeModifiers: [                  │
│    { modifierId: 1, effect: 'easier'}│
│  ]                                   │
└─────────────────────────────────────┘
```

---

## Soft Delete Pattern

All user-created entities support soft delete via `deletedAt` timestamp:

```sql
-- Query active records only
SELECT * FROM exercises
WHERE user_id = $1
  AND deleted_at IS NULL;

-- Soft delete
UPDATE exercises
SET deleted_at = NOW()
WHERE id = $1;
```

---

## JSONB Indexing Considerations

For frequently queried JSONB fields, consider adding GIN indexes:

```sql
-- If searching sequences by exercise IDs becomes slow:
CREATE INDEX sequences_exercises_gin ON sequences
USING GIN (exercises jsonb_path_ops);

-- If searching executions by exercise performance:
CREATE INDEX executions_exercises_gin ON sequence_executions
USING GIN (exercises jsonb_path_ops);
```

---

## Migration Notes

When implementing the modifiers system:

1. **Add `modifiers` table** - New table, no migration needed
2. **Add `goal` to sequences** - Default 'strict', backfill existing
3. **Add `availableModifiers` to sequences** - Default `[]`, backward compatible
4. **Update JSONB structures** - Additive changes, existing data remains valid
5. **PR signature matching** - `null` signature matches old PRs (no modifiers)
