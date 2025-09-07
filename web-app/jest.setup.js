import '@testing-library/jest-dom'
import React from 'react'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (target, prop) => {
        const Component = ({ children, ...props }) => {
          const { initial, animate, transition, whileInView, viewport, ...otherProps } = props
          return React.createElement(prop, otherProps, children)
        }
        Component.displayName = `motion.${String(prop)}`
        return Component
      },
    }
  ),
  AnimatePresence: ({ children }) => children,
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
}))