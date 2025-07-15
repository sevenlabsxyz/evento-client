import { cn } from '@/lib/utils'

type ShortcutKeyProps = {
  keys: string[]
  className?: string
  withBg?: boolean
}

export function ShortcutKey({ keys, className, withBg = false }: ShortcutKeyProps) {
  const keyMap: Record<string, string> = {
    mod: '⌘',
    shift: '⇧',
    alt: '⌥',
    ctrl: '⌃',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs text-muted-foreground',
        className
      )}
    >
      {keys.map((key, index) => (
        <kbd
          key={index}
          className={cn(
            'min-w-[1.25rem] px-1 py-0.5 text-center font-mono text-[0.625rem]',
            withBg && 'rounded border bg-muted'
          )}
        >
          {keyMap[key.toLowerCase()] || key}
        </kbd>
      ))}
    </span>
  )
}