import { render, screen } from '@testing-library/react'
import { ProblemSection } from '../problem-section'

describe('ProblemSection', () => {
  it('renders the section header', () => {
    render(<ProblemSection />)
    expect(screen.getByText('The Problem Every Agent Faces')).toBeInTheDocument()
    expect(screen.getByText('The Real Estate Game Has')).toBeInTheDocument()
    expect(screen.getByText('Changed')).toBeInTheDocument()
  })

  it('displays the main problem description', () => {
    render(<ProblemSection />)
    expect(screen.getByText(/Traditional prospecting methods are failing/)).toBeInTheDocument()
    expect(screen.getByText(/smart agents are building relationships/)).toBeInTheDocument()
  })

  it('shows all three main problems', () => {
    render(<ProblemSection />)
    
    // Market Saturation
    expect(screen.getByText('Market Saturation')).toBeInTheDocument()
    expect(screen.getByText('Every agent is fighting over the same MLS listings')).toBeInTheDocument()
    expect(screen.getByText('20+ agents')).toBeInTheDocument()
    expect(screen.getByText('competing per listing')).toBeInTheDocument()
    
    // Late Discovery
    expect(screen.getByText('Late Discovery')).toBeInTheDocument()
    expect(screen.getByText('By the time it hits MLS, you\'re already behind')).toBeInTheDocument()
    expect(screen.getByText('0 days')).toBeInTheDocument()
    expect(screen.getByText('head start on MLS')).toBeInTheDocument()
    
    // Reactive Approach
    expect(screen.getByText('Reactive Approach')).toBeInTheDocument()
    expect(screen.getByText('Always responding to the market instead of predicting it')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('of agents are reactive')).toBeInTheDocument()
  })

  it('displays the pain point story section', () => {
    render(<ProblemSection />)
    expect(screen.getByText('Sound Familiar?')).toBeInTheDocument()
    expect(screen.getByText(/I saw the listing hit MLS at 9 AM/)).toBeInTheDocument()
    expect(screen.getByText(/By 9:30 AM, there were already 12 agents/)).toBeInTheDocument()
  })

  it('shows the key insight about timing', () => {
    render(<ProblemSection />)
    expect(screen.getByText(/The agents who win aren't the ones who respond fastest/)).toBeInTheDocument()
    expect(screen.getByText(/knew about the opportunity 6-12 months earlier/)).toBeInTheDocument()
  })

  it('displays intelligence source hints', () => {
    render(<ProblemSection />)
    expect(screen.getByText('Court filings predict power of sale listings')).toBeInTheDocument()
    expect(screen.getByText('Estate filings predict probate sales')).toBeInTheDocument()
    expect(screen.getByText('Development apps predict new construction')).toBeInTheDocument()
  })

  it('has proper section id for navigation', () => {
    const { container } = render(<ProblemSection />)
    const section = container.querySelector('section')
    expect(section).toHaveAttribute('id', 'problem')
  })

  it('uses appropriate styling classes', () => {
    const { container } = render(<ProblemSection />)
    const section = container.querySelector('section')
    expect(section).toHaveClass('bg-gray-50')
  })

  it('has cards with hover effects', () => {
    const { container } = render(<ProblemSection />)
    const cards = container.querySelectorAll('[class*="border-l-4"]')
    expect(cards).toHaveLength(3)
  })
})