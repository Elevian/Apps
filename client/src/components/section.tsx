import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SectionProps {
  id?: string
  children: ReactNode
  className?: string
  background?: 'default' | 'muted'
  as?: 'section' | 'main' | 'aside' | 'article'
  'aria-label'?: string
  'aria-labelledby'?: string
}

export function Section({ 
  id, 
  children, 
  className, 
  background = 'default',
  as: Component = 'section',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy
}: SectionProps) {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <motion.div
      className={cn(
        "py-16 px-4 sm:px-6 lg:px-8",
        background === 'muted' && "bg-muted/50",
        className
      )}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        duration: prefersReducedMotion ? 0 : 0.6, 
        ease: "easeOut" 
      }}
    >
      <Component
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className="max-w-6xl mx-auto"
        role={undefined}
      >
        {children}
      </Component>
    </motion.div>
  )
}
