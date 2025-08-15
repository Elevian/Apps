import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Github, MessageSquare, Send, Heart } from 'lucide-react'
import { toast } from 'sonner'

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success('Message sent!', {
        description: 'Thank you for your feedback. We\'ll get back to you soon.'
      })
      setFormData({ name: '', email: '', message: '' })
    }, 2000)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const links = [
    {
      icon: Github,
      title: 'GitHub Repository',
      description: 'View source code and contribute',
      url: 'https://github.com',
      badge: 'Open Source'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help with technical issues',
      url: 'mailto:support@example.com',
      badge: 'Support'
    },
    {
      icon: MessageSquare,
      title: 'Discord Community',
      description: 'Join our developer community',
      url: 'https://discord.com',
      badge: 'Community'
    }
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
          Get in Touch
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Have questions, suggestions, or want to contribute? We'd love to hear from you.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send us a Message
              </CardTitle>
              <CardDescription>
                We'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <Textarea
                  placeholder="Your message..."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  disabled={isSubmitting}
                  className="min-h-[120px]"
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Send className="h-4 w-4 mr-2 animate-pulse" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Links */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6"
        >
          {links.map((link) => {
            const IconComponent = link.icon
            return (
              <Card key={link.title} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{link.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {link.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Additional Info */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Made with ❤️</h3>
              <p className="text-sm text-muted-foreground">
                This project is a labor of love, combining passion for literature 
                with modern technology to create something meaningful.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-center space-y-4 pt-8 border-t border-border"
      >
        <p className="text-sm text-muted-foreground">
          © 2025 Gutenberg Characters. Built with React, TypeScript, and AI.
        </p>
        <div className="flex justify-center gap-4">
          <Badge variant="outline">Privacy Focused</Badge>
          <Badge variant="outline">Open Source</Badge>
          <Badge variant="outline">No Tracking</Badge>
        </div>
      </motion.div>
    </div>
  )
}
