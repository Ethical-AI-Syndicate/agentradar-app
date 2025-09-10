import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Data Processing Agreement | AgentRadar",
  description: "AgentRadar's Data Processing Agreement",
};

export default function DataProcessingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
              <span className="text-xl font-bold">AgentRadar</span>
            </Link>
            <Link href="/contact">
              <Button>Contact Us</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8">Data Processing Agreement</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">Last updated: January 1, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Overview</h2>
            <p className="text-gray-700 mb-4">
              This Data Processing Agreement (&quot;DPA&quot;) governs the
              processing of personal data by AgentRadar on behalf of our
              customers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              Data Processing Principles
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Process data only as instructed by the customer</li>
              <li>
                Implement appropriate technical and organizational measures
              </li>
              <li>Ensure confidentiality of personal data</li>
              <li>Delete or return data upon request</li>
              <li>Assist with data subject requests</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Security Measures</h2>
            <p className="text-gray-700 mb-4">
              We implement industry-standard security measures including
              encryption, access controls, and regular security audits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Sub-processors</h2>
            <p className="text-gray-700 mb-4">
              We maintain a list of approved sub-processors and notify customers
              of any changes in accordance with applicable data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
            <p className="text-gray-700">
              For questions about this DPA, contact our Data Protection Officer
              at dpo@agentradar.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
