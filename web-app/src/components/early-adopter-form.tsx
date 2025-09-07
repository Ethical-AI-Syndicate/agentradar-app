"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Gift,
  Shield,
  Zap
} from "lucide-react"
import { motion } from "framer-motion"

interface EarlyAdopterFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  brokerageName: string
  businessType: string
  yearsExperience: string
  currentListings: string
  averageListingPrice: string
  targetMarkets: string[]
  currentChallenges: string[]
  preferredCommunication: string
  bestContactTime: string
  agreeToTerms: boolean
}

export function EarlyAdopterForm({ open, onOpenChange }: EarlyAdopterFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    brokerageName: "",
    businessType: "",
    yearsExperience: "",
    currentListings: "",
    averageListingPrice: "",
    targetMarkets: [],
    currentChallenges: [],
    preferredCommunication: "",
    bestContactTime: "",
    agreeToTerms: false
  })

  const updateFormData = (field: keyof FormData, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
      setError(null) // Clear error when navigating
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setError(null) // Clear error when navigating
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Call the Next.js API route
      const response = await fetch('/api/early-adopters/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }
      
      const result = await response.json()
      console.log('Registration successful:', result)
      
      setIsSubmitted(true)
    } catch (error) {
      console.error('Registration failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleChallenge = (challenge: string) => {
    const challenges = formData.currentChallenges
    if (challenges.includes(challenge)) {
      updateFormData('currentChallenges', challenges.filter(c => c !== challenge))
    } else {
      updateFormData('currentChallenges', [...challenges, challenge])
    }
  }

  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold mb-2">Welcome to the Future! 🚀</h2>
              <p className="text-green-100 text-lg mb-6">
                You're now part of an exclusive group of forward-thinking real estate professionals.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/20 rounded-lg p-6 backdrop-blur-sm"
            >
              <h3 className="font-semibold text-xl mb-4">What Happens Next?</h3>
              <div className="space-y-3 text-left text-green-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">1</div>
                  <span>We'll email you your early adopter token within 24 hours</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">2</div>
                  <span>You'll get exclusive updates on our launch progress</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">3</div>
                  <span>First access to AgentRadar when we go live (with 50% lifetime discount!)</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-6"
            >
              <Button 
                onClick={() => onOpenChange(false)}
                className="bg-white text-green-600 hover:bg-green-50"
              >
                Close
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Gift className="w-6 h-6" />
              Claim Your Early Adopter Benefits
            </DialogTitle>
            <p className="text-blue-100 mt-2">
              Join the exclusive group of agents building tomorrow's pipelines today
            </p>
          </DialogHeader>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-blue-100 mb-2">
              <span>Step {step} of 3</span>
              <span>{Math.round((step / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-blue-500/30 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Benefits Banner */}
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 p-4 mb-6">
            <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-500" />
              Early Adopter Exclusive Benefits
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-orange-800">
                <Badge variant="secondary" className="bg-orange-200 text-orange-800 px-2 py-1">50%</Badge>
                Lifetime discount on all plans
              </div>
              <div className="flex items-center gap-2 text-orange-800">
                <Zap className="w-4 h-4 text-orange-600" />
                Priority feature access
              </div>
              <div className="flex items-center gap-2 text-orange-800">
                <Shield className="w-4 h-4 text-orange-600" />
                Direct founder support
              </div>
              <div className="flex items-center gap-2 text-orange-800">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                Success story opportunities
              </div>
            </div>
          </Card>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Let's Get Acquainted
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    placeholder="John"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    placeholder="Smith"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="john@example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="(416) 555-0123"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brokerageName">Brokerage/Company *</Label>
                  <Input
                    id="brokerageName"
                    value={formData.brokerageName}
                    onChange={(e) => updateFormData('brokerageName', e.target.value)}
                    placeholder="RE/MAX Toronto"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Input
                    id="businessType"
                    value={formData.businessType}
                    onChange={(e) => updateFormData('businessType', e.target.value)}
                    placeholder="Real Estate Agent"
                    className="mt-1"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Business Information */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Tell Us About Your Business
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Years of Experience</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['0-2 years', '3-5 years', '6-10 years', '10+ years'].map((years) => (
                      <Button
                        key={years}
                        variant={formData.yearsExperience === years ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFormData('yearsExperience', years)}
                        className="text-xs"
                      >
                        {years}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Current Listings</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['0-5', '6-15', '16-30', '30+'].map((listings) => (
                      <Button
                        key={listings}
                        variant={formData.currentListings === listings ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFormData('currentListings', listings)}
                        className="text-xs"
                      >
                        {listings}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Average Listing Price</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['Under $500K', '$500K-$1M', '$1M-$2M', '$2M+'].map((price) => (
                    <Button
                      key={price}
                      variant={formData.averageListingPrice === price ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFormData('averageListingPrice', price)}
                      className="text-xs"
                    >
                      {price}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Target Markets (Select All That Apply)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Residential Sales', 'Investment Properties', 'Luxury Homes', 'Commercial'].map((market) => (
                    <Button
                      key={market}
                      variant={formData.targetMarkets.includes(market) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const markets = formData.targetMarkets
                        if (markets.includes(market)) {
                          updateFormData('targetMarkets', markets.filter(m => m !== market))
                        } else {
                          updateFormData('targetMarkets', [...markets, market])
                        }
                      }}
                      className="text-sm"
                    >
                      {market}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Current Prospecting Challenges (Select All That Apply)</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {[
                    'Too much competition on MLS listings',
                    'Hard to find motivated sellers',
                    'Spending too much time on lead generation',
                    'Difficulty building relationships before need arises',
                    'Limited access to off-market opportunities'
                  ].map((challenge) => (
                    <Button
                      key={challenge}
                      variant={formData.currentChallenges.includes(challenge) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleChallenge(challenge)}
                      className="text-left text-sm h-auto p-3 justify-start"
                    >
                      {challenge}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Technology & Preferences */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Final Details
              </h3>
              
              <div>
                <Label>Preferred Communication</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Email', 'Phone', 'Text/SMS', 'Any'].map((comm) => (
                    <Button
                      key={comm}
                      variant={formData.preferredCommunication === comm ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFormData('preferredCommunication', comm)}
                      className="text-sm"
                    >
                      {comm}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Best Time to Contact</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Morning', 'Afternoon', 'Evening', 'Anytime'].map((time) => (
                    <Button
                      key={time}
                      variant={formData.bestContactTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFormData('bestContactTime', time)}
                      className="text-sm"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📧 What You'll Receive:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Early adopter token via email within 24 hours</li>
                  <li>• Exclusive updates on launch progress</li>
                  <li>• Priority access when we go live</li>
                  <li>• 50% lifetime discount on all plans</li>
                  <li>• Direct line to our founder team</li>
                </ul>
              </div>

              <div className="bg-gray-50 border rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => updateFormData('agreeToTerms', e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <p className="text-xs text-gray-600">
                    I agree to receive email communications from AgentRadar about our platform launch and real estate intelligence insights. We respect your privacy and will never share your information with third parties. You can unsubscribe at any time. *
                  </p>
                </label>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <div className="w-4 h-4 text-red-500 mr-2">⚠️</div>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className={step === 1 ? 'invisible' : ''}
            >
              Back
            </Button>
            
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.brokerageName || !formData.businessType)) ||
                  (step === 2 && (!formData.yearsExperience || !formData.currentListings || !formData.averageListingPrice || formData.targetMarkets.length === 0))
                }
                className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.preferredCommunication || !formData.bestContactTime || !formData.agreeToTerms}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Claiming Benefits...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Claim My Early Adopter Benefits
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}