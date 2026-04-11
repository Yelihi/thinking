import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/utils/cn"

const badgeVariants = cva(`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ring-1 ring-inset`, {
    variants: {
        tone: {
            neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
            success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
            warning: 'bg-amber-50 text-amber-700 ring-amber-200',
            critical: 'bg-red-50 text-red-700 ring-red-200',
            muted: 'bg-slate-50 text-slate-500 ring-slate-200',
        }
    },
    defaultVariants: {
        tone: 'neutral'
    }
})

export function Badge({ tone = 'neutral', children, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
    return (
        <span
            className={cn(badgeVariants({ tone }))}
            {...props}
        >
            {children}
        </span>
    );
}