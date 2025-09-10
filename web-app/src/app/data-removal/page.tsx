import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Shield, Trash2, Download, Eye, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Data Removal Request | AgentRadar",
  description: "Request deletion of your personal data from AgentRadar",
};

export default function DataRemovalPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-gradient-to-r from-blue-500 to-orange-500" />
              <span className="text-xl font-bold">AgentRadar</span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link
                href="/privacy"
                className="text-gray-600 hover:text-gray-900"
              >
                Privacy
              </Link>
              <Link href="/contact">
                <Button>Contact Support</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 bg-gradient-to-br from-red-50 to-pink-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-red-100 text-red-800 border-red-200">
            <Shield className="w-4 h-4 mr-2" />
            GDPR & Privacy Rights
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Data Removal{" "}
            <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Request
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Exercise your right to have your personal data deleted from
            AgentRadar&apos;s systems. We respect your privacy and will process
            your request within 30 days.
          </p>
        </div>
      </section>

      {/* Data Rights Information */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your Data Rights
            </h2>
            <p className="text-lg text-gray-600">
              Under GDPR and other privacy laws, you have the following rights
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Eye,
                title: "Right to Access",
                description: "Request a copy of your personal data",
              },
              {
                icon: Shield,
                title: "Right to Rectify",
                description: "Correct inaccurate or incomplete data",
              },
              {
                icon: Trash2,
                title: "Right to Erasure",
                description: "Request deletion of your personal data",
              },
              {
                icon: Download,
                title: "Right to Portability",
                description: "Receive your data in a portable format",
              },
            ].map((right, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <right.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{right.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{right.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Removal Form */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-red-600" />
                Data Deletion Request Form
              </CardTitle>
              <p className="text-gray-600">
                Please fill out this form to request the deletion of your
                personal data. We will verify your identity and process your
                request within 30 days.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-2">
                      Important Notice
                    </h3>
                    <p className="text-yellow-700 text-sm">
                      Deleting your data is irreversible. This action will
                      permanently remove your account and all associated data,
                      including property alerts, preferences, and transaction
                      history. Please consider downloading your data first.
                    </p>
                  </div>
                </div>
              </div>

              <form className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Personal Information
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" name="firstName" required />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" name="lastName" required />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="The email address associated with your AgentRadar account"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Optional: Help us verify your identity"
                    />
                  </div>
                </div>

                {/* Request Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Request Details
                  </h3>

                  <div>
                    <Label htmlFor="requestType">Type of Request</Label>
                    <select
                      id="requestType"
                      name="requestType"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full-deletion">
                        Complete Data Deletion
                      </option>
                      <option value="partial-deletion">
                        Partial Data Deletion
                      </option>
                      <option value="account-closure">
                        Account Closure Only
                      </option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason for Request</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="Please explain why you're requesting data deletion (optional)"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Verification */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Identity Verification
                  </h3>

                  <div>
                    <Label htmlFor="lastLogin">
                      Approximate Last Login Date
                    </Label>
                    <Input
                      id="lastLogin"
                      name="lastLogin"
                      type="date"
                      placeholder="Help us verify your identity"
                    />
                  </div>

                  <div>
                    <Label htmlFor="additionalInfo">
                      Additional Verification Information
                    </Label>
                    <Textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      placeholder="Any additional information that can help us verify your identity (e.g., recent property searches, alerts you created, etc.)"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Data Download Option */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Data Export (Optional)
                  </h3>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="exportData" />
                    <Label htmlFor="exportData" className="text-sm">
                      Send me a copy of my data before deletion (recommended)
                    </Label>
                  </div>
                </div>

                {/* Legal Confirmations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Legal Confirmations
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox id="confirm1" required />
                      <Label htmlFor="confirm1" className="text-sm">
                        I confirm that I am the owner of this account and have
                        the right to request data deletion *
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox id="confirm2" required />
                      <Label htmlFor="confirm2" className="text-sm">
                        I understand that data deletion is permanent and
                        irreversible *
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox id="confirm3" required />
                      <Label htmlFor="confirm3" className="text-sm">
                        I understand that some data may be retained for legal
                        compliance purposes *
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox id="confirm4" />
                      <Label htmlFor="confirm4" className="text-sm">
                        I consent to being contacted for identity verification
                        purposes
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                  <Button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Submit Deletion Request
                  </Button>

                  <Button type="button" variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Request Data Export Only
                  </Button>
                </div>
              </form>

              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-gray-900 mb-2">
                  What happens next?
                </h4>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                  <li>
                    We&apos;ll acknowledge your request within 2 business days
                  </li>
                  <li>
                    Identity verification (may require additional information)
                  </li>
                  <li>Processing of your deletion request (up to 30 days)</li>
                  <li>Confirmation email once deletion is complete</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Need Help?</h2>
          <p className="text-lg text-gray-600 mb-8">
            If you have questions about data deletion or need assistance with
            this form, our privacy team is here to help.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Privacy Team
                </h3>
                <p className="text-gray-600 mb-4">
                  For all privacy-related inquiries
                </p>
                <Button variant="outline">
                  Contact: privacy@agentradar.app
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Data Protection Officer
                </h3>
                <p className="text-gray-600 mb-4">For GDPR and legal matters</p>
                <Button variant="outline">Contact: dpo@agentradar.app</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
