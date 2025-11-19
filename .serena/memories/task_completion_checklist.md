# Task Completion Checklist

When completing a coding task, follow this checklist:

## 1. Type Checking
```bash
# Always run type checking
npm run lint
# or specifically:
tsc --noEmit
```
- Fix all TypeScript errors
- Ensure strict mode compliance
- Verify no unused variables/parameters

## 2. Linting
```bash
# Run ESLint
npm run lint
```
- Fix all ESLint errors
- Address warnings if possible
- Follow TanStack and Convex recommended rules

## 3. Code Formatting
```bash
# Format all files
npm run format
```
- Prettier will auto-format according to .prettierrc
- No semicolons, single quotes, trailing commas

## 4. Build Verification
```bash
# Verify production build works
npm run build
```
- Ensure build completes without errors
- Check bundle size if relevant

## 5. Manual Testing
- Test in development mode: `npm run dev`
- Verify changes work as expected
- Test edge cases
- Check responsive design if UI changes
- Verify authentication flows if auth-related

## 6. Convex-Specific Checks
- Verify Convex functions use new syntax with `args` and `returns`
- Ensure user authentication is properly handled
- Confirm indexes are used for queries
- Check soft delete filters are applied
- Test real-time data sync

## 7. Code Review Checklist
- [ ] No console.log or debug statements left
- [ ] Comments are meaningful and necessary
- [ ] Code follows existing patterns
- [ ] No security vulnerabilities (XSS, injection, etc.)
- [ ] Error handling is appropriate
- [ ] Loading states are handled
- [ ] Accessibility considerations (ARIA, keyboard nav)

## 8. Git
```bash
# Check what changed
git status
git diff

# Commit changes
git add .
git commit -m "descriptive message"
```

## Notes
- **No Test Suite**: This project currently has no automated tests
- **CI/CD**: No CI/CD pipeline detected
- **Pre-commit Hooks**: None configured (no husky/lint-staged)

## Common Issues to Avoid
1. Forgetting to authenticate in Convex functions
2. Using old Convex function syntax without validators
3. Not filtering soft-deleted items
4. Direct `.filter()` instead of `.withIndex()` for queries
5. Missing loading/error states in React components
6. Hardcoded values instead of using environment variables