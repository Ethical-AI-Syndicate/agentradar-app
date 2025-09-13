'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-LHSTSYPHZ2';

// Google Analytics tracking function
export const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag(...args);
  }
};

// Track page views
export const trackPageView = (url: string) => {
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Google Analytics Script Component
export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    // Track page changes
    const url = pathname + searchParams.toString();
    trackPageView(url);
  }, [pathname, searchParams]);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `,
        }}
      />
    </>
  );
}

// Hook for tracking events in components
export const useAnalytics = () => {
  const trackClick = (element: string, page?: string) => {
    trackEvent('click', 'engagement', `${element}${page ? `_${page}` : ''}`);
  };

  const trackFormSubmission = (form: string) => {
    trackEvent('submit', 'form', form);
  };

  const trackSignUp = (method: string) => {
    trackEvent('sign_up', 'user', method);
  };

  const trackLogin = (method: string) => {
    trackEvent('login', 'user', method);
  };

  const trackPurchase = (value: number, currency: string = 'USD') => {
    trackEvent('purchase', 'ecommerce', 'subscription', value);
    gtag('event', 'purchase', {
      transaction_id: Date.now().toString(),
      value: value,
      currency: currency,
    });
  };

  const trackPropertyView = (propertyId: string) => {
    trackEvent('view_item', 'property', propertyId);
  };

  const trackSearch = (searchTerm: string) => {
    trackEvent('search', 'property', searchTerm);
  };

  return {
    trackClick,
    trackFormSubmission,
    trackSignUp,
    trackLogin,
    trackPurchase,
    trackPropertyView,
    trackSearch,
  };
};