import { render, screen, fireEvent } from '@testing-library/react'
import { HeroSection } from '../hero-section'

// Mock the EarlyAdopterForm component
jest.mock('../early-adopter-form', () => ({
  EarlyAdopterForm: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    <div data-testid="early-adopter-form" style={{ display: open ? 'block' : 'none' }}>
      <button onClick={() => onOpenChange(false)}>Close Form</button>
    </div>
  ),
}))

describe('HeroSection', () => {
  it('renders the main headline', () => {
    render(<HeroSection />)
    expect(screen.getByText('Find Tomorrow\'s')).toBeInTheDocument()
    expect(screen.getByText('Listings Today')).toBeInTheDocument()
  })

  it('renders the subheadline with key messaging', () => {
    render(<HeroSection />)
    expect(screen.getByText(/Discover properties/)).toBeInTheDocument()
    expect(screen.getByText(/6-12 months before MLS/)).toBeInTheDocument()
    expect(screen.getByText(/court filings, estate sales, and development applications/)).toBeInTheDocument()
  })

  it('displays social proof badge', () => {
    render(<HeroSection />)
    expect(screen.getByText(/Join 1,200\+ forward-thinking agents/)).toBeInTheDocument()
  })

  it('shows value propositions', () => {
    render(<HeroSection />)
    expect(screen.getByText('6-12 Month Head Start')).toBeInTheDocument()
    expect(screen.getByText('Ontario Market Focus')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered Scoring')).toBeInTheDocument()
  })

  it('has CTA buttons', () => {
    render(<HeroSection />)
    expect(screen.getByText('Get Early Access (50% Off Lifetime)')).toBeInTheDocument()
    expect(screen.getByText('Watch Demo')).toBeInTheDocument()
  })

  it('displays risk reversal messaging', () => {
    render(<HeroSection />)
    expect(screen.getByText(/No credit card required/)).toBeInTheDocument()
    expect(screen.getByText(/Setup in 2 minutes/)).toBeInTheDocument()
    expect(screen.getByText(/Cancel anytime/)).toBeInTheDocument()
  })

  it('shows dashboard preview with mock property alerts', () => {
    render(<HeroSection />)
    expect(screen.getByText('Property Intelligence Dashboard')).toBeInTheDocument()
    expect(screen.getByText('123 Maple Street, Toronto')).toBeInTheDocument()
    expect(screen.getByText('456 Oak Avenue, Mississauga')).toBeInTheDocument()
    expect(screen.getByText('789 Pine Road, Vaughan')).toBeInTheDocument()
  })

  it('opens early adopter form when CTA button is clicked', () => {
    render(<HeroSection />)
    const ctaButton = screen.getByText('Get Early Access (50% Off Lifetime)')
    fireEvent.click(ctaButton)
    
    const form = screen.getByTestId('early-adopter-form')
    expect(form).toBeVisible()
  })

  it('displays floating stats', () => {
    render(<HeroSection />)
    expect(screen.getByText('+247%')).toBeInTheDocument()
    expect(screen.getByText('Lead Generation')).toBeInTheDocument()
    expect(screen.getByText('6-12')).toBeInTheDocument()
    expect(screen.getByText('Months Earlier')).toBeInTheDocument()
  })

  it('has navigation menu', () => {
    render(<HeroSection />)
    expect(screen.getByText('AgentRadar')).toBeInTheDocument()
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Pricing')).toBeInTheDocument()
    expect(screen.getByText('FAQ')).toBeInTheDocument()
  })

  it('shows total opportunities counter', () => {
    render(<HeroSection />)
    expect(screen.getByText('Total Opportunities This Week')).toBeInTheDocument()
    expect(screen.getByText('47 Properties')).toBeInTheDocument()
  })

  it('displays opportunity scores for each property', () => {
    render(<HeroSection />)
    expect(screen.getByText('92')).toBeInTheDocument()
    expect(screen.getByText('87')).toBeInTheDocument()
    expect(screen.getByText('95')).toBeInTheDocument()
  })
})