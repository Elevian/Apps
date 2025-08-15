import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react'

export function HeroSection() {
  const scrollToAnalyzer = () => {
    document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Theme-specific Background */}
      <div className="absolute inset-0 -z-10">
        {/* Mint Theme - Gradient */}
        <div className="absolute inset-0 opacity-0 [html[data-theme=mint]_&]:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50" />
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/50 via-transparent to-green-100/30" />
        </div>

        {/* Rose Theme - Photo Overlay */}
        <div className="absolute inset-0 opacity-0 [html[data-theme=rose]_&]:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-red-50" />
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-100/40 via-transparent to-pink-100/20" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-rose-100/20 bg-[radial-gradient(circle_at_1px_1px,rgba(236,72,153,0.1)_1px,transparent_0)] bg-[length:20px_20px]" />
          </div>
        </div>

        {/* Slate Theme - Solid */}
        <div className="absolute inset-0 opacity-0 [html[data-theme=slate]_&]:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Hero Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Badge variant="outline" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Powered by AI & Project Gutenberg
          </Badge>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="space-y-6"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight">
            <span className="text-foreground">Unlock the</span>
            <br />
            <span className="text-primary bg-clip-text">Hidden Stories</span>
            <br />
            <span className="text-foreground">in Literature</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-light">
            Discover character relationships, analyze narrative patterns, and visualize the 
            connections that bring classic literature to life—all powered by cutting-edge AI.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex justify-center items-center gap-8 sm:gap-12"
        >
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary">60,000+</div>
            <div className="text-sm text-muted-foreground">Classic Books</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary">AI-Powered</div>
            <div className="text-sm text-muted-foreground">Analysis</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary">Instant</div>
            <div className="text-sm text-muted-foreground">Insights</div>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
        >
          <Button 
            size="lg" 
            onClick={scrollToAnalyzer}
            className="group min-w-[200px] h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <BookOpen className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
            Analyze a Book
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={scrollToAbout}
            className="min-w-[200px] h-14 text-lg font-semibold bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all"
          >
            Learn More
          </Button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
