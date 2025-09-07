"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Mail, 
  Phone, 
  MapPin,
  Twitter,
  Linkedin,
  Youtube,
  Facebook,
  ExternalLink
} from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Demo", href: "#demo" },
      { label: "API Documentation", href: "/api-docs" },
      { label: "White Label", href: "/white-label" },
      { label: "Integrations", href: "/integrations" }
    ],
    company: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press Kit", href: "/press-kit" },
      { label: "Blog", href: "/blog" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Contact", href: "/contact" }
    ],
    resources: [
      { label: "Help Center", href: "/help" },
      { label: "Getting Started", href: "/getting-started" },
      { label: "Agent Training", href: "/agent-training" },
      { label: "Best Practices", href: "/best-practices" },
      { label: "Webinars", href: "/webinars" },
      { label: "Community Forum", href: "/community" }
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "GDPR Compliance", href: "/gdpr" },
      { label: "Security", href: "/security" },
      { label: "Data Processing", href: "/data-processing" }
    ]
  }

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com/agentradar", label: "Twitter" },
    { icon: Linkedin, href: "https://www.linkedin.com/in/mikeholownych", label: "LinkedIn" },
    { icon: Facebook, href: "https://facebook.com/agentradar", label: "Facebook" },
    { icon: Youtube, href: "https://youtube.com/@agentradar", label: "YouTube" }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="py-16 grid lg:grid-cols-5 gap-12">
          
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
              <span className="text-2xl font-bold">AgentRadar</span>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              The premier real estate intelligence platform helping agents find properties 
              6-12 months before they hit MLS through court filings, estate sales, and 
              development applications.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-blue-400" />
                <a href="mailto:sales@agentradar.app" className="hover:text-white transition-colors">
                  sales@agentradar.app
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-blue-400" />
                <a href="tel:+14162774176" className="hover:text-white transition-colors">
                  (416) 277-4176
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span>Toronto, Ontario, Canada</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-gray-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                  >
                    {link.label}
                    {link.href === "#" && <ExternalLink className="w-3 h-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                  >
                    {link.label}
                    {link.href === "#" && <ExternalLink className="w-3 h-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Company</h3>
            <ul className="space-y-3 mb-8">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                  >
                    {link.label}
                    {link.href === "#" && <ExternalLink className="w-3 h-3" />}
                  </a>
                </li>
              ))}
            </ul>

            <h4 className="text-sm font-semibold mb-4 text-gray-400">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-gray-300 transition-colors text-sm flex items-center gap-2"
                  >
                    {link.label}
                    {link.href === "#" && <ExternalLink className="w-3 h-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="bg-gray-800" />

        {/* Newsletter Signup */}
        <div className="py-8 text-center">
          <h3 className="text-xl font-semibold mb-4">Stay Updated</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Get the latest insights on real estate intelligence, market trends, and new features. 
            Join our newsletter for exclusive content.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
              Subscribe
            </Button>
          </div>
        </div>

        <Separator className="bg-gray-800" />

        {/* Bottom Bar */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            © {currentYear} AgentRadar. All rights reserved.
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>All systems operational</span>
            </div>
            <span>Built with ❤️ in Toronto</span>
          </div>
        </div>
      </div>
    </footer>
  )
}