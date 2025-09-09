import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Cookie Policy | AgentRadar",
  description: "AgentRadar's Cookie Policy - Learn how we use cookies",
}

export default function CookiesPage() {
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
        <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">Last updated: January 1, 2025</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">What Are Cookies</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files stored on your device when you visit our website. 
              They help us provide you with a better browsing experience.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">How We Use Cookies</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Essential cookies for website functionality</li>
              <li>Analytics cookies to improve our service</li>
              <li>Preference cookies to remember your settings</li>
              <li>Marketing cookies for relevant advertising</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Managing Cookies</h2>
            <p className="text-gray-700 mb-4">
              You can control cookies through your browser settings. Note that disabling 
              certain cookies may affect website functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about this Cookie Policy, contact us at legal@agentradar.app
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}