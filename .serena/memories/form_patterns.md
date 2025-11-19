# Form Patterns

This document defines the standard patterns for creating forms in this codebase.

## Technology Stack

- **Form Management**: TanStack Form (@tanstack/react-form)
- **Error Display**: shadcn Alert component
- **Validation**: TanStack Form built-in validators
- **Backend**: Convex mutations

## Standard Form Pattern

### Basic Structure

```tsx
import { useForm } from '@tanstack/react-form'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import { useState } from 'react'

export function ExampleForm({ onSuccess }: { onSuccess: () => void }) {
  const mutation = useMutation(api.module.mutationName)
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        await mutation(value)
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) =>
            !value ? 'Name is required' : undefined,
        }}
        children={(field) => (
          <div>
            <label htmlFor={field.name} className="block text-sm font-medium">
              Name *
            </label>
            <input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {field.state.meta.errors && (
              <p className="text-sm text-red-600 mt-1">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      />

      <button
        type="submit"
        disabled={form.state.isSubmitting}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {form.state.isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

## Key Principles

### 1. Error Handling

**DO:**
- Use Alert component for async mutation errors
- Show errors inline, never use `alert()`
- Clear error state on new submission attempts
- Provide specific error messages from backend

**DON'T:**
- Use `alert()` for any errors
- Use generic "Something went wrong" messages
- Leave errors from previous attempts visible during retry

### 2. Validation

**Field-level validation:**
```tsx
validators={{
  onChange: ({ value }) => {
    if (!value) return 'Field is required'
    if (value.length < 3) return 'Must be at least 3 characters'
    return undefined
  },
}}
```

**Form-level validation:**
```tsx
validators={{
  onSubmit: ({ value }) => {
    if (value.password !== value.confirmPassword) {
      return 'Passwords must match'
    }
    return undefined
  },
}}
```

### 3. Loading States

Always disable submit button during submission:
```tsx
disabled={form.state.isSubmitting}
```

Show loading text:
```tsx
{form.state.isSubmitting ? 'Saving...' : 'Save'}
```

### 4. Success Handling

Use callbacks, not alerts:
```tsx
onSubmit: async ({ value }) => {
  await mutation(value)
  onSuccess() // Close modal, navigate, etc.
}
```

## Common Patterns

### Optional Fields

```tsx
defaultValues: {
  description: '',
},
```

Submit only if not empty:
```tsx
const data = {
  name: value.name,
  description: value.description.trim() || undefined,
}
```

### Arrays (e.g., tags, links)

```tsx
const [items, setItems] = useState<string[]>([])
const [inputValue, setInputValue] = useState('')

const addItem = () => {
  if (inputValue.trim()) {
    setItems([...items, inputValue.trim()])
    setInputValue('')
  }
}

const removeItem = (index: number) => {
  setItems(items.filter((_, i) => i !== index))
}
```

### File Uploads

```tsx
const [fileId, setFileId] = useState<Id<'_storage'> | undefined>()
const [uploading, setUploading] = useState(false)
const generateUploadUrl = useMutation(api.module.generateUploadUrl)

const handleFileUpload = async (file: File) => {
  setUploading(true)
  try {
    const uploadUrl = await generateUploadUrl()
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    const { storageId } = await result.json()
    setFileId(storageId)
  } catch (err) {
    setError('Failed to upload file')
  } finally {
    setUploading(false)
  }
}
```

## Alert Variants

```tsx
// Error
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>{error}</AlertDescription>
</Alert>

// Success
<Alert>
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Item saved successfully</AlertDescription>
</Alert>

// Warning
<Alert variant="default">
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>This action cannot be undone</AlertDescription>
</Alert>
```

## Migration from Old Pattern

**Before (React state + alert):**
```tsx
const [name, setName] = useState('')

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  try {
    await mutation({ name })
  } catch (error) {
    alert('Failed to save')
  }
}
```

**After (TanStack Form + Alert):**
```tsx
const [error, setError] = useState<string | null>(null)

const form = useForm({
  defaultValues: { name: '' },
  onSubmit: async ({ value }) => {
    setError(null)
    try {
      await mutation(value)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    }
  },
})
```

## References

- TanStack Form: https://tanstack.com/form/latest
- shadcn Alert: https://ui.shadcn.com/docs/components/alert
- shadcn Forms Guide: https://ui.shadcn.com/docs/forms/tanstack-form
