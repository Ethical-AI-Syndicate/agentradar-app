"use client"

import { Navigation } from "./navigation"
import { Footer } from "./footer"
import { ReactNode } from "react"

interface PageLayoutProps {
  children: ReactNode
  className?: string
  showNavigation?: boolean
  showFooter?: boolean
  navigationStyle?: "dark" | "light"
}

export function PageLayout({ 
  children, 
  className = "", 
  showNavigation = true,
  showFooter = true,
  navigationStyle = "light"
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-white ${className}`}>
      {showNavigation && (
        <div className={`border-b backdrop-blur-sm sticky top-0 z-50 ${
          navigationStyle === "dark" 
            ? "bg-slate-900/95 text-white" 
            : "bg-white/95 text-gray-900"
        }`}>
          <Navigation />
        </div>
      )}
      
      {children}
      
      {showFooter && <Footer />}
    </div>
  )
}