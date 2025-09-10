"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageCircle,
  Calendar,
  Shield,
  Zap,
  Users,
} from "lucide-react";

export function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const faqs = [
    {
      category: "Getting Started",
      icon: Zap,
      questions: [
        {
          question: "How quickly can I start receiving property alerts?",
          answer:
            "After signing up, you'll start receiving alerts within 24 hours. Our system immediately begins monitoring court filings, estate sales, and development applications in your specified geographic areas. You can customize your alert criteria during the onboarding process.",
        },
        {
          question: "What geographic areas does AgentRadar cover?",
          answer:
            "We currently focus on the Greater Toronto Area (GTA) including Toronto, Mississauga, Brampton, Vaughan, Markham, Richmond Hill, Oakville, Burlington, and surrounding municipalities. We're expanding to other Ontario markets based on demand from our early adopters.",
        },
        {
          question: "Do I need any special software or technical skills?",
          answer:
            "No technical skills required! AgentRadar works through your web browser, mobile app, or desktop application. If you can use email and browse the web, you can use AgentRadar. Our onboarding process includes a guided tour and training resources.",
        },
      ],
    },
    {
      category: "Data & Accuracy",
      icon: Shield,
      questions: [
        {
          question: "How accurate is the property information?",
          answer:
            "Our data comes directly from official government sources including Ontario Superior Court bulletins, municipal development applications, and probate filings. We update our database multiple times daily and use AI to verify and cross-reference information for accuracy.",
        },
        {
          question: "How far in advance will I know about opportunities?",
          answer:
            "Timing varies by opportunity type: Power of sale proceedings typically give you 6-12 months advance notice, estate sales 3-9 months, and development applications 12+ months. This gives you significant time to build relationships before properties hit the market.",
        },
        {
          question:
            "What if the information changes or opportunities don&apos;t materialize?",
          answer:
            "Legal proceedings can change, and not every filing results in a sale. We track updates and notify you of status changes. Our AI scoring considers the likelihood of each opportunity actually reaching market, helping you focus on the most promising leads.",
        },
      ],
    },
    {
      category: "Pricing & Plans",
      icon: Users,
      questions: [
        {
          question: "What does the early adopter discount include?",
          answer:
            "Early adopters get 50% off their chosen plan for life, priority access to new features, direct communication with our founder team, and the opportunity to influence our product roadmap. This pricing is locked in permanently - even if our regular prices increase.",
        },
        {
          question: "Can I change plans or cancel anytime?",
          answer:
            "Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at your next billing cycle. We also offer a 30-day money-back guarantee if you're not completely satisfied with AgentRadar.",
        },
        {
          question: "Are there any setup fees or hidden costs?",
          answer:
            "No setup fees, no hidden costs, no long-term contracts. The price you see is what you pay. All plans include customer support, regular updates, and access to our core intelligence sources.",
        },
      ],
    },
    {
      category: "White-Label & Enterprise",
      icon: Users,
      questions: [
        {
          question: "How does white-label deployment work for brokerages?",
          answer:
            "We deploy a fully branded version of AgentRadar on your custom domain (e.g., intelligence.yourbrokerage.com). Your agents log in to your branded platform with their own accounts. Setup typically takes 5-7 business days and includes data migration and team training.",
        },
        {
          question: "Can we integrate with our existing CRM and tools?",
          answer:
            "Yes! We offer API access and pre-built integrations with major CRM platforms including Salesforce, HubSpot, Chime, and others. Our team helps set up custom integrations during the onboarding process.",
        },
        {
          question: "What kind of training and support do you provide?",
          answer:
            "Enterprise customers receive dedicated onboarding, live training sessions for your team, comprehensive documentation, priority support, and a dedicated account manager. We ensure your entire team is successfully using the platform.",
        },
      ],
    },
  ];

  const toggleFAQ = (categoryIndex: number, questionIndex: number) => {
    const faqIndex = categoryIndex * 100 + questionIndex;
    setOpenFAQ(openFAQ === faqIndex ? null : faqIndex);
  };

  return (
    <section className="py-20 bg-white" id="faq">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            style={{ opacity: 1 }}
          >
            <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
              <HelpCircle className="w-4 h-4 mr-1" />
              Frequently Asked Questions
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Got{" "}
              <span className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                Questions?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Find answers to the most common questions about AgentRadar.
              Can&apos;t find what you&apos;re looking for? We&apos;re here to
              help.
            </p>
          </motion.div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
              viewport={{ once: true }}
              style={{ opacity: 1 }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <category.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {category.category}
                </h3>
              </div>

              {/* Category Questions */}
              <div className="space-y-4">
                {category.questions.map((faq, questionIndex) => {
                  const faqIndex = categoryIndex * 100 + questionIndex;
                  const isOpen = openFAQ === faqIndex;

                  return (
                    <Card
                      key={questionIndex}
                      className="border-2 border-gray-100 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFAQ(categoryIndex, questionIndex)}
                        className="w-full p-6 text-left hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-gray-900 pr-4">
                            {faq.question}
                          </h4>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          )}
                        </div>
                      </button>

                      <motion.div
                        initial={false}
                        animate={{
                          height: isOpen ? "auto" : 0,
                          opacity: isOpen ? 1 : 0,
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{ opacity: 1 }}
          className="mt-16 text-center"
        >
          <Card className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Still Have Questions?
              </h3>
              <p className="text-gray-600 mb-8">
                Our team is here to help you understand how AgentRadar can
                transform your real estate business. Get in touch for
                personalized answers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat with Support
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule a Demo
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-blue-200">
                <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Typically respond within 2 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span>Live chat available 9am-6pm EST</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
