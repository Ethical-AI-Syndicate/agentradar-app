import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "GDPR Compliance | AgentRadar",
  description: "AgentRadar's GDPR compliance information",
}

export default function GDPRPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
              <span className="text-xl font-bold">AgentRadar</span>
            </Link>
            <Link href="/contact"><Button>Contact Us</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">GDPR Compliance</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">Last updated: January 1, 2025</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Rights Under GDPR</h2>
            <p className="text-gray-700 mb-4">
              If you are a resident of the EU, you have the following data protection rights:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Right to access your personal data</li>
              <li>Right to correct inaccurate data</li>
              <li>Right to delete your data</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Data Processing</h2>
            <p className="text-gray-700 mb-4">
              We process personal data lawfully, fairly, and transparently. We only collect 
              data necessary for providing our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Exercising Your Rights</h2>
            <p className="text-gray-700 mb-4">
              To exercise any of your GDPR rights, contact us at gdpr@agentradar.app. 
              We will respond within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Data Protection Officer</h2>
            <p className="text-gray-700">
              For GDPR-related inquiries, contact our Data Protection Officer at dpo@agentradar.app
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}