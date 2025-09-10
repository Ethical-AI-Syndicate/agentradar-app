"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

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
          >
            {item.name}
          </Link>
        ))}
        <div className="flex items-center space-x-4 ml-6">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              Sign In
            </Button>
          </Link>
          <Link href="/enterprise-demo">
            <Button className="bg-blue-600 hover:bg-blue-700">
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
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex flex-col space-y-3 pt-4 border-t border-gray-700">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-center text-gray-300 hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/enterprise-demo" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
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