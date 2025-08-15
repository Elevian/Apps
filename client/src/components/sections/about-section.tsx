import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, BookOpen, Network, Zap, Github, ExternalLink } from 'lucide-react'

export function AboutSection() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced language models identify characters, relationships, and narrative patterns with high accuracy.',
      tech: ['Groq API', 'Llama 3', 'NLP']
    },
    {
      icon: BookOpen,
      title: 'Project Gutenberg Integration',
      description: 'Access to over 60,000 free eBooks from the world\'s largest digital library of classic literature.',
      tech: ['REST API', 'Text Processing', 'Metadata']
    },
    {
      icon: Network,
      title: 'Interactive Visualizations',
      description: 'Dynamic network graphs and charts that make complex character relationships easy to understand.',
      tech: ['D3.js', 'Force Layout', 'SVG']
    },
    {
      icon: Zap,
      title: 'Real-time Processing',
      description: 'Fast analysis and visualization generation with optimized algorithms and caching strategies.',
      tech: ['WebSockets', 'Caching', 'Optimization']
    }
  ]

  const technologies = [
    { name: 'React', category: 'Frontend' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Groq API', category: 'AI' },
    { name: 'Tailwind CSS', category: 'Styling' },
    { name: 'Framer Motion', category: 'Animation' },
    { name: 'Radix UI', category: 'Components' },
    { name: 'Vite', category: 'Build Tool' }
  ]

  return (
    <div className="space-y-12">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          About This Project
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          A modern web application that combines artificial intelligence with classic literature 
          to provide new insights into character relationships and narrative structures.
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {features.map((feature, index) => {
          const IconComponent = feature.icon
          return (
            <Card key={feature.title} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {feature.tech.map((tech) => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Technology Stack */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
            <CardDescription>
              Modern tools and frameworks powering this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {technologies.map((tech) => (
                <div key={tech.name} className="text-center p-3 rounded-lg border">
                  <p className="font-medium text-sm">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">{tech.category}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Project Info */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Open Source
            </CardTitle>
            <CardDescription>
              This project is open source and available on GitHub
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The complete source code is available for developers to explore, contribute to, 
              or adapt for their own projects. Built with modern best practices and comprehensive documentation.
            </p>
            <div className="flex gap-2">
              <Badge variant="outline">MIT License</Badge>
              <Badge variant="outline">TypeScript</Badge>
              <Badge variant="outline">Well Documented</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Use Cases
            </CardTitle>
            <CardDescription>
              Applications for education and research
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Literature students analyzing character development</li>
              <li>• Researchers studying narrative structures</li>
              <li>• Educators creating interactive learning materials</li>
              <li>• Book clubs exploring classic literature</li>
              <li>• Digital humanities projects</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
