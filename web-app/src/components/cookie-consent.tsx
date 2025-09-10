"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Cookie, Settings } from "lucide-react";
import Link from "next/link";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      // Show banner after a brief delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("cookieConsent", JSON.stringify(consent));

    // Initialize analytics and other services
    if (typeof window !== "undefined" && consent.analytics) {
      // Initialize Google Analytics or other services here
      console.log("Analytics initialized");
    }

    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("cookieConsent", JSON.stringify(consent));
    setShowBanner(false);
  };

  const handleSavePreferences = (preferences: Record<string, boolean>) => {
    const consent = {
      necessary: true, // Always required
      ...preferences,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("cookieConsent", JSON.stringify(consent));

    // Initialize services based on preferences
    if (
      typeof window !== "undefined" &&
      "analytics" in consent &&
      (consent as Record<string, unknown>).analytics
    ) {
      console.log("Analytics initialized with user preferences");
    }

    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
        <Card className="border-0 rounded-none">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Cookie className="w-5 h-5 text-orange-600" />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  We use cookies to enhance your experience
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  We use essential cookies to make our website work, and
                  analytics cookies to understand how you use our site and
                  improve your experience.
                  <Link
                    href="/cookies"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    Learn more about our cookie policy
                  </Link>
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleAcceptAll}
                  >
                    Accept All Cookies
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPreferences(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Customize Preferences
                  </Button>

                  <Button size="sm" variant="ghost" onClick={handleRejectAll}>
                    Reject Non-Essential
                  </Button>
                </div>
              </div>

              <button
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close cookie banner"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cookie Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Cookie Preferences
                </h2>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <CookiePreferencesForm onSave={handleSavePreferences} />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function CookiePreferencesForm({
  onSave,
}: {
  onSave: (preferences: Record<string, boolean>) => void;
}) {
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false,
    preferences: false,
  });

  const cookieCategories = [
    {
      key: "necessary",
      title: "Necessary Cookies",
      description:
        "Essential cookies required for the website to function properly. These cannot be disabled.",
      enabled: true,
      required: true,
    },
    {
      key: "analytics",
      title: "Analytics Cookies",
      description:
        "Help us understand how visitors use our website to improve performance and user experience.",
      enabled: preferences.analytics,
      required: false,
    },
    {
      key: "marketing",
      title: "Marketing Cookies",
      description:
        "Used to deliver relevant advertisements and track campaign effectiveness.",
      enabled: preferences.marketing,
      required: false,
    },
    {
      key: "preferences",
      title: "Preference Cookies",
      description:
        "Remember your choices and preferences to provide a personalized experience.",
      enabled: preferences.preferences,
      required: false,
    },
  ];

  const handleToggle = (key: string, value: boolean) => {
    if (key === "necessary") return; // Cannot disable necessary cookies

    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    onSave(preferences);
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        Choose which types of cookies you&apos;re comfortable with. You can
        change these settings at any time by clicking the cookie icon in the
        footer.
      </p>

      <div className="space-y-4">
        {cookieCategories.map((category) => (
          <div key={category.key} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{category.title}</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={category.enabled}
                  disabled={category.required}
                  onChange={(e) => handleToggle(category.key, e.target.checked)}
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    category.enabled ? "bg-blue-600" : "bg-gray-200"
                  } ${category.required ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      category.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </label>
            </div>
            <p className="text-sm text-gray-600">{category.description}</p>
            {category.required && (
              <p className="text-xs text-gray-500 mt-1">Always enabled</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 flex-1"
        >
          Save Preferences
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setPreferences({
              analytics: true,
              marketing: true,
              preferences: true,
            });
          }}
          className="flex-1"
        >
          Accept All
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        For more information, read our{" "}
        <Link href="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/cookies" className="text-blue-600 hover:underline">
          Cookie Policy
        </Link>
      </p>
    </div>
  );
}
