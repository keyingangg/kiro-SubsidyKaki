import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '../lib/utils'

/* ── Button ──────────────────────────────────────────────────── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'teal'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40 disabled:opacity-50 disabled:pointer-events-none touch-target',
        variant === 'primary'   && 'bg-teal-700 text-white hover:bg-teal-800 shadow-btn-teal',
        variant === 'teal'      && 'bg-teal-500 text-white hover:bg-teal-600 shadow-btn-teal',
        variant === 'secondary' && 'bg-white text-navy-500 border border-neutral-300 hover:bg-neutral-50 shadow-card',
        variant === 'ghost'     && 'text-navy-500 hover:bg-neutral-100',
        variant === 'danger'    && 'bg-danger-500 text-white hover:bg-danger-600',
        size === 'sm' && 'text-sm px-4 py-2.5 min-h-[44px]',
        size === 'md' && 'text-base px-5 py-3.5 min-h-[52px]',
        size === 'lg' && 'text-lg px-6 py-4 min-h-[60px] rounded-2xl',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
Button.displayName = 'Button'

/* ── Card ────────────────────────────────────────────────────── */
export function Card({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl border border-neutral-200 shadow-card',
        onClick && 'cursor-pointer hover:shadow-card-md transition-shadow active:scale-[0.99]',
        className
      )}
    >
      {children}
    </div>
  )
}

/* ── Badge ───────────────────────────────────────────────────── */
interface BadgeProps { children: React.ReactNode; variant?: 'orange' | 'teal' | 'navy' | 'success' | 'danger' | 'gray'; className?: string }
export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
      variant === 'orange'  && 'bg-orange-50 text-orange-600 border border-orange-200',
      variant === 'teal'    && 'bg-teal-50 text-teal-600 border border-teal-200',
      variant === 'navy'    && 'bg-navy-50 text-navy-500 border border-navy-100',
      variant === 'success' && 'bg-success-50 text-success-500 border border-success-400/30',
      variant === 'danger'  && 'bg-danger-50 text-danger-500 border border-danger-400/30',
      variant === 'gray'    && 'bg-neutral-100 text-neutral-600 border border-neutral-300',
      className
    )}>
      {children}
    </span>
  )
}

/* ── Section heading ─────────────────────────────────────────── */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3', className)}>{children}</p>
}

/* ── Divider ─────────────────────────────────────────────────── */
export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px bg-neutral-200', className)} />
}

/* ── Toggle ──────────────────────────────────────────────────── */
import { motion } from 'framer-motion'
interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; id: string; label: string; sublabel?: string }
export function Toggle({ checked, onChange, id, label, sublabel }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="flex-1 cursor-pointer">
        <p className="text-base font-medium text-neutral-900">{label}</p>
        {sublabel && <p className="text-sm text-neutral-500 mt-0.5">{sublabel}</p>}
      </label>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-12 h-7 rounded-full transition-colors duration-200 focus-visible:ring-4 focus-visible:ring-teal-500/40 focus-visible:outline-none flex-shrink-0',
          checked ? 'bg-teal-700' : 'bg-neutral-300'
        )}
      >
        <motion.span
          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
          animate={{ left: checked ? '26px' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  )
}

/* ── Page shell ──────────────────────────────────────────────── */
export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-h-full bg-neutral-50 flex flex-col', className)}>
      {children}
    </div>
  )
}

/* ── TopBar ──────────────────────────────────────────────────── */
interface TopBarProps { title?: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode }
export function TopBar({ title, subtitle, onBack, right }: TopBarProps) {
  return (
    <div className="flex items-center gap-3 px-5 pt-3 pb-4 bg-white border-b border-neutral-200">
      {onBack && (
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors flex-shrink-0"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        {title && <h1 className="text-lg font-bold text-neutral-900 truncate">{title}</h1>}
        {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  )
}
