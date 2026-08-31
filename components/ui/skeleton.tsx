import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'djon-skeleton overflow-hidden border border-djon-text/6 bg-djon-text/6 rounded-md',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
