'use client'

import { motion, AnimatePresence, type Variants } from 'framer-motion'
import type { ComponentProps, ReactNode } from 'react'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
}

export const slideInFromBottom: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
}

export const slideInFromTop: Variants = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
}

// Stagger children animation
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

export const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

export const smoothTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
}

export const quickTransition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.15,
}

// ============================================================================
// ANIMATED COMPONENTS
// ============================================================================

type MotionDivProps = ComponentProps<typeof motion.div>

/**
 * Fade in animation wrapper
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  ...props
}: {
  children: ReactNode
  delay?: number
  duration?: number
} & Omit<MotionDivProps, 'initial' | 'animate' | 'exit'>) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Slide up and fade in animation
 */
export function SlideUp({
  children,
  delay = 0,
  duration = 0.4,
  ...props
}: {
  children: ReactNode
  delay?: number
  duration?: number
} & Omit<MotionDivProps, 'initial' | 'animate' | 'exit'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Scale in animation (good for modals, cards)
 */
export function ScaleIn({
  children,
  delay = 0,
  ...props
}: {
  children: ReactNode
  delay?: number
} & Omit<MotionDivProps, 'initial' | 'animate' | 'exit'>) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
        delay,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Staggered list animation container
 */
export function StaggerList({
  children,
  className,
  ...props
}: {
  children: ReactNode
  className?: string
} & Omit<MotionDivProps, 'initial' | 'animate' | 'variants'>) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Staggered list item - use inside StaggerList
 */
export function StaggerItem({
  children,
  className,
  ...props
}: {
  children: ReactNode
  className?: string
} & Omit<MotionDivProps, 'variants'>) {
  return (
    <motion.div variants={staggerItem} className={className} {...props}>
      {children}
    </motion.div>
  )
}

/**
 * Page transition wrapper - use for route transitions
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Collapsible content animation
 */
export function Collapse({
  children,
  isOpen,
}: {
  children: ReactNode
  isOpen: boolean
}) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Presence wrapper for conditional rendering with animation
 */
export function Presence({
  children,
  show,
  mode = 'sync',
}: {
  children: ReactNode
  show: boolean
  mode?: 'sync' | 'wait' | 'popLayout'
}) {
  return (
    <AnimatePresence mode={mode}>
      {show && children}
    </AnimatePresence>
  )
}

/**
 * Button press animation wrapper
 */
export function PressableScale({
  children,
  className,
  scale = 0.97,
  ...props
}: {
  children: ReactNode
  className?: string
  scale?: number
} & Omit<MotionDivProps, 'whileTap'>) {
  return (
    <motion.div
      whileTap={{ scale }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Hover scale animation
 */
export function HoverScale({
  children,
  className,
  scale = 1.02,
  ...props
}: {
  children: ReactNode
  className?: string
  scale?: number
} & Omit<MotionDivProps, 'whileHover'>) {
  return (
    <motion.div
      whileHover={{ scale }}
      transition={{
        type: 'tween' as const,
        ease: 'easeOut',
        duration: 0.15,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Number counter animation
 */
export function AnimatedNumber({
  value,
  duration = 0.5,
  className,
}: {
  value: number
  duration?: number
  className?: string
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
      transition={{ duration }}
    >
      {value}
    </motion.span>
  )
}

/**
 * Success checkmark animation
 */
export function SuccessCheck({ size = 48 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-green-500"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <motion.path
        d="M9 12l2 2 4-4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4, ease: 'easeOut' }}
      />
    </motion.svg>
  )
}

// Re-export framer-motion primitives for convenience
export { motion, AnimatePresence }
