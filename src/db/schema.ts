import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'

// Re-export auth tables from better-auth schema
export { user, session, account, verification } from './auth-schema'
import { user } from './auth-schema'

// ============================================================================
// EXERCISES TABLE
// ============================================================================
export const exercises = pgTable(
  'exercises',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    tips: text('tips'),
    modifications: text('modifications').array(),
    level: text('level'), // 'beginner' | 'intermediate' | 'advanced'
    category: text('category'), // 'yoga' | 'calisthenics' | 'cardio' | 'flexibility' | 'strength'
    bodyParts: text('body_parts').array(), // ['arms', 'legs', 'core', 'back', 'chest', 'shoulders', 'full-body']
    photoUrls: text('photo_urls').array().default([]).notNull(),
    videoUrls: text('video_urls').array().default([]).notNull(),
    links: text('links').array().default([]).notNull(),
    isPreBuilt: boolean('is_pre_built').default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    {
      userIdIdx: index('exercises_user_id_idx').on(table.userId),
      levelIdx: index('exercises_level_idx').on(table.userId, table.level),
      categoryIdx: index('exercises_category_idx').on(
        table.userId,
        table.category,
      ),
    },
  ],
)

// ============================================================================
// SEQUENCES TABLE
// ============================================================================
export const sequences = pgTable(
  'sequences',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    level: text('level'), // 'beginner' | 'intermediate' | 'advanced'
    category: text('category'), // 'yoga' | 'calisthenics' | 'cardio' | 'flexibility' | 'strength'
    // JSON structure: Array<{ exerciseId: number | 'break', config: { goal: 'strict' | 'elastic', measure: 'repetitions' | 'time', targetValue?: number }, modifiers?: Array<{ modifierId: number, effect: 'easier' | 'harder' | 'neutral' }> }>
    exercises: jsonb('exercises').notNull(),
    // JSON structure: Array<number> - modifier IDs that are available for this sequence
    availableModifiers: jsonb('available_modifiers').default([]),
    isFavorite: boolean('is_favorite').default(false),
    isPreBuilt: boolean('is_pre_built').default(false),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    {
      userIdIdx: index('sequences_user_id_idx').on(table.userId),
      favoriteIdx: index('sequences_favorite_idx').on(
        table.userId,
        table.isFavorite,
      ),
    },
  ],
)

// ============================================================================
// SEQUENCE EXECUTIONS TABLE
// ============================================================================
export const sequenceExecutions = pgTable(
  'sequence_executions',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sequenceId: integer('sequence_id')
      .notNull()
      .references(() => sequences.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at').notNull(),
    completedAt: timestamp('completed_at'),
    // JSON structure: Array<{ exerciseId: number | 'break', startedAt: timestamp, completedAt?: timestamp, value?: number, skipped?: boolean, activeModifiers?: Array<{ modifierId: number, value?: string }> }>
    exercises: jsonb('exercises').notNull(),
    pausedAt: timestamp('paused_at'),
    totalPauseDuration: integer('total_pause_duration').default(0).notNull(),
    rating: integer('rating'), // 1-5 scale
    feedback: text('feedback'),
    // JSON structure: Array<{ exerciseId: number, type: 'repetitions' | 'time', previousBest?: number, newBest: number, modifierSignature?: string }>
    personalRecords: jsonb('personal_records'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    {
      userIdIdx: index('executions_user_id_idx').on(table.userId),
      sequenceIdIdx: index('executions_sequence_id_idx').on(table.sequenceId),
    },
  ],
)

// ============================================================================
// USER SETTINGS TABLE
// ============================================================================
export const userSettings = pgTable(
  'user_settings',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    userName: text('user_name').notNull(),
    beepEnabled: boolean('beep_enabled').default(false).notNull(),
    beepStartSeconds: integer('beep_start_seconds').default(3).notNull(),
    level: text('level'), // 'beginner' | 'intermediate' | 'advanced'
    focusArea: text('focus_area'), // 'yoga' | 'calisthenics' | 'cardio' | 'flexibility' | 'strength'
    hapticEnabled: boolean('haptic_enabled').default(true),
    contrastMode: boolean('contrast_mode').default(false),
    weeklyGoal: integer('weekly_goal'), // number of workouts per week
    theme: text('theme'), // 'energy' | 'zen'
    currentStreak: integer('current_streak').default(0),
    longestStreak: integer('longest_streak').default(0),
    lastWorkoutDate: timestamp('last_workout_date'),
    badges: text('badges').array().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    {
      userIdIdx: index('settings_user_id_idx').on(table.userId),
    },
  ],
)

// ============================================================================
// MODIFIERS TABLE (Equipment like bands, blocks, weights)
// ============================================================================
export const modifiers = pgTable(
  'modifiers',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    unit: text('unit'), // 'kg' | 'lbs' | 'cm' | 'inches' | 'level' | 'none'
    value: integer('value'), // numeric value (e.g., 5, 10, 15)
    iconName: text('icon_name'), // e.g., "dumbbell", "band", "block"
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    {
      userIdIdx: index('modifiers_user_id_idx').on(table.userId),
    },
  ],
)

// ============================================================================
// ACHIEVEMENTS TABLE
// ============================================================================
export const achievements = pgTable(
  'achievements',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    badgeId: text('badge_id').notNull(),
    unlockedAt: timestamp('unlocked_at').notNull(),
    category: text('category').notNull(), // 'milestone' | 'streak' | 'personal-record' | 'consistency'
    // JSON structure: { value?: number, exerciseName?: string }
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    {
      userIdIdx: index('achievements_user_id_idx').on(table.userId),
      categoryIdx: index('achievements_category_idx').on(
        table.userId,
        table.category,
      ),
    },
  ],
)
