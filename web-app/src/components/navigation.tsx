"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

// Google Analytics event tracking function
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const navigationItems = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Demo", href: "/demo" },
    { name: "FAQ", href: pathname === "/" ? "#faq" : "/#faq" }
  ]

  return (
    <nav className="relative z-10 flex items-center justify-between p-6 lg:px-8">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
        <span className="text-xl font-bold">AgentRadar</span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-6">
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="text-gray-300 hover:text-white transition-colors"
            onClick={() => {
              trackEvent('navigation_click', {
                nav_item: item.name.toLowerCase(),
                nav_location: 'header_desktop',
                event_category: 'navigation',
                event_label: `nav_${item.name.toLowerCase()}`
              });
            }}
          >
            {item.name}
          </Link>
        ))}
        <div className="flex items-center space-x-4 ml-6">
          <Link href="/login">
            <Button 
              variant="ghost" 
              className="text-gray-300 hover:text-white"
              onClick={() => {
                trackEvent('sign_in_clicked', {
                  button_location: 'header_desktop',
                  event_category: 'authentication',
                  event_label: 'header_sign_in'
                });
              }}
            >
              Sign In
            </Button>
          </Link>
          <Link href="/enterprise-demo">
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                trackEvent('get_started_clicked', {
                  button_location: 'header_desktop',
                  event_category: 'conversion',
                  event_label: 'header_get_started'
                });
              }}
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-gray-300 hover:text-white"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-gray-700 md:hidden">
          <div className="px-6 py-4 space-y-4">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-gray-300 hover:text-white transition-colors"
                onClick={() => {
                  trackEvent('navigation_click', {
                    nav_item: item.name.toLowerCase(),
                    nav_location: 'mobile_menu',
                    event_category: 'navigation',
                    event_label: `mobile_nav_${item.name.toLowerCase()}`
                  });
                  setIsMenuOpen(false);
                }}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex flex-col space-y-3 pt-4 border-t border-gray-700">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button 
                  variant="ghost" 
                  className="w-full justify-center text-gray-300 hover:text-white"
                  onClick={() => {
                    trackEvent('sign_in_clicked', {
                      button_location: 'mobile_menu',
                      event_category: 'authentication',
                      event_label: 'mobile_sign_in'
                    });
                  }}
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/enterprise-demo" onClick={() => setIsMenuOpen(false)}>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    trackEvent('get_started_clicked', {
                      button_location: 'mobile_menu',
                      event_category: 'conversion',
                      event_label: 'mobile_get_started'
                    });
                  }}
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}