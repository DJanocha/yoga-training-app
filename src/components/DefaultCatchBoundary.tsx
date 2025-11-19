export function DefaultCatchBoundary({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <pre className="bg-muted p-4 rounded text-sm overflow-auto">
          {error?.message || 'Unknown error'}
        </pre>
      </div>
    </div>
  )
}
