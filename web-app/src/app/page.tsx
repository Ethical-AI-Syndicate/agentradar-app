"use client";

import { useEffect } from "react";
import { HeroSection } from "@/components/hero-section";
import { ProblemSection } from "@/components/problem-section";
import { SolutionSection } from "@/components/solution-section";
import { FeaturesSection } from "@/components/features-section";
import { SocialProofSection } from "@/components/social-proof-section";
import { PricingSection } from "@/components/pricing-section";
import { FAQSection } from "@/components/faq-section";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

// Google Analytics event tracking function
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

export default function LandingPage() {
  useEffect(() => {
    // Track page view
    trackEvent('page_view', {
      page_title: 'Landing Page',
      page_location: '/',
      event_category: 'engagement'
    });

    // Scroll depth tracking
    let maxScrollDepth = 0;
    const scrollDepthMarkers = [25, 50, 75, 90, 100];
    const trackedMarkers = new Set<number>();

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
      }

      // Track scroll depth milestones
      scrollDepthMarkers.forEach(marker => {
        if (scrollPercent >= marker && !trackedMarkers.has(marker)) {
          trackedMarkers.add(marker);
          trackEvent('scroll_depth', {
            scroll_depth: marker,
            event_category: 'engagement',
            event_label: `scroll_${marker}_percent`
          });
        }
      });
    };

    // Track time on page when user leaves
    const startTime = Date.now();
    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      trackEvent('time_on_page', {
        time_seconds: timeOnPage,
        max_scroll_depth: maxScrollDepth,
        event_category: 'engagement',
        event_label: 'page_engagement'
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <SocialProofSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
