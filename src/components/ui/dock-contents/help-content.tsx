type HelpContentProps = {
  helpContent: {
    title: string
    description: string
    tips?: string[]
  }
}

export function HelpContent({ helpContent }: HelpContentProps) {
  return (
    <div className="p-4">
      <h3 className="font-semibold text-sm mb-2">{helpContent.title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{helpContent.description}</p>
      {helpContent.tips && helpContent.tips.length > 0 && (
        <ul className="space-y-1.5">
          {helpContent.tips.map((tip, index) => (
            <li key={index} className="text-xs text-muted-foreground flex gap-2">
              <span className="text-primary">•</span>
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
