# Google Analytics 4 (GA4) Event Tracking Guide

This document outlines all the Google Analytics 4 events implemented across the AgentRadar platform to track user engagement, conversions, and behavior.

## GA4 Configuration

- **Measurement ID**: `G-LHSTSYPHZ2`
- **Implementation**: Google Tag Manager via custom Analytics component
- **Location**: `web-app/src/components/analytics.tsx`

## Event Categories

### 1. Navigation Events

#### `navigation_click`
Tracks when users click on navigation items.

**Parameters:**
- `nav_item`: The navigation item clicked (features, pricing, demo, faq)
- `nav_location`: Location of nav (header_desktop, mobile_menu)
- `event_category`: "navigation"
- `event_label`: nav_[item] or mobile_nav_[item]

**Triggered by:**
- Desktop header navigation clicks
- Mobile menu navigation clicks

#### `sign_in_clicked`
Tracks sign-in button clicks.

**Parameters:**
- `button_location`: header_desktop, mobile_menu
- `event_category`: "authentication"
- `event_label`: header_sign_in, mobile_sign_in

#### `get_started_clicked`
Tracks "Get Started" button clicks in navigation.

**Parameters:**
- `button_location`: header_desktop, mobile_menu
- `event_category`: "conversion"
- `event_label`: header_get_started, mobile_get_started

### 2. Call-to-Action Events

#### `early_access_clicked`
Tracks clicks on the primary "Get Early Access" buttons.

**Parameters:**
- `button_location`: hero_section
- `button_text`: "Get Early Access (50% Off Lifetime)"
- `event_category`: "engagement"
- `event_label`: "primary_cta"

#### `demo_clicked`
Tracks clicks on "Watch Demo" buttons.

**Parameters:**
- `button_location`: hero_section
- `button_text`: "Watch Demo"
- `event_category`: "engagement"
- `event_label`: "secondary_cta"

#### `early_adopter_benefits_clicked`
Tracks clicks on the main CTA section button.

**Parameters:**
- `button_location`: cta_section
- `button_text`: "Claim My Early Adopter Benefits"
- `event_category`: "conversion"
- `event_label`: "main_cta"
- `urgency_context`: "limited_spots"

### 3. Form Events

#### `form_opened`
Tracks when the early adopter form is opened.

**Parameters:**
- `event_category`: "form_interaction"
- `event_label`: "early_adopter_form_opened"
- `form_type`: "early_adopter_registration"

#### `form_abandoned`
Tracks when users abandon the form (close without completing).

**Parameters:**
- `event_category`: "form_interaction"
- `event_label`: "early_adopter_form_abandoned"
- `form_step`: Current step when abandoned
- `form_type`: "early_adopter_registration"
- `form_completion_percentage`: Percentage of form completed

#### `form_step_completed`
Tracks successful progression through form steps.

**Parameters:**
- `step_number`: Current step number
- `next_step`: Next step number
- `event_category`: "form_progression"
- `event_label`: "step_[current]_to_[next]"
- `form_type`: "early_adopter_registration"

#### `form_step_back`
Tracks backward navigation in forms.

**Parameters:**
- `from_step`: Step navigated from
- `to_step`: Step navigated to
- `event_category`: "form_navigation"
- `event_label`: "step_[from]_back_to_[to]"
- `form_type`: "early_adopter_registration"

#### `form_submission_started`
Tracks when form submission begins.

**Parameters:**
- `event_category`: "form_submission"
- `event_label`: "early_adopter_registration"
- `form_step`: Final step number
- `user_type`: Business type selected
- `years_experience`: Experience level selected

#### `form_submission_success`
Tracks successful form submissions (conversions).

**Parameters:**
- `event_category`: "conversion"
- `event_label`: "early_adopter_registered"
- `form_step`: Final step number
- `user_type`: Business type
- `years_experience`: Experience level
- `brokerage_provided`: Boolean if brokerage name provided
- `phone_provided`: Boolean if phone provided
- `target_markets_count`: Number of target markets selected
- `challenges_count`: Number of challenges selected

#### `form_submission_error`
Tracks form submission failures.

**Parameters:**
- `event_category`: "form_error"
- `event_label`: "early_adopter_registration_failed"
- `error_message`: Error message received
- `form_step`: Step where error occurred
- `user_type`: Business type

### 4. Engagement Events

#### `page_view`
Tracks landing page visits.

**Parameters:**
- `page_title`: "Landing Page"
- `page_location`: "/"
- `event_category`: "engagement"

#### `scroll_depth`
Tracks how far users scroll on the page.

**Parameters:**
- `scroll_depth`: Percentage scrolled (25, 50, 75, 90, 100)
- `event_category`: "engagement"
- `event_label`: "scroll_[percentage]_percent"

#### `time_on_page`
Tracks how long users spend on the page.

**Parameters:**
- `time_seconds`: Time spent in seconds
- `max_scroll_depth`: Maximum scroll percentage reached
- `event_category`: "engagement"
- `event_label`: "page_engagement"

## Key Conversion Events

### Primary Conversions
1. **`form_submission_success`** - Early adopter registration completed
2. **`early_adopter_benefits_clicked`** - Main CTA clicked
3. **`early_access_clicked`** - Hero CTA clicked

### Secondary Conversions
1. **`get_started_clicked`** - Navigation CTA clicked
2. **`demo_clicked`** - Demo interest expressed
3. **`form_opened`** - Form engagement started

## Analytics Dashboards & Reports

### Recommended GA4 Reports

1. **Conversion Funnel**
   - Page views → CTA clicks → Form opens → Form submissions
   - Track drop-off at each stage

2. **User Engagement**
   - Average time on page
   - Scroll depth distribution
   - Navigation usage patterns

3. **Form Performance**
   - Form abandonment by step
   - Completion rates
   - Error frequency

4. **Campaign Attribution**
   - Traffic sources leading to conversions
   - CTA performance by location
   - Mobile vs desktop engagement

### Custom Events to Monitor

- **High-value events**: `form_submission_success`, `early_adopter_benefits_clicked`
- **Engagement events**: `scroll_depth`, `time_on_page`, `demo_clicked`
- **Drop-off events**: `form_abandoned`, `form_submission_error`

## Implementation Notes

1. **Global Window Declaration**: Each component includes TypeScript declarations for `window.gtag`
2. **Client-Side Only**: All tracking functions check for browser environment
3. **Error Handling**: Safe fallbacks if GA4 isn't loaded
4. **Event Parameters**: Consistent naming convention for easy filtering
5. **Privacy Compliance**: No PII is tracked in custom events

## Testing & Validation

1. **GA4 DebugView**: Enable debug mode to test events in real-time
2. **Browser Console**: Events are safely handled even if GA4 isn't loaded
3. **Event Parameters**: Verify all parameters are passing correctly
4. **Cross-Device**: Test on desktop and mobile for all tracked interactions

## Future Enhancements

1. **Enhanced E-commerce**: Track pricing section interactions
2. **Social Proof**: Track testimonial and social proof engagement
3. **Content Interaction**: Track FAQ expansions and feature explorations
4. **A/B Testing**: Implement experiment tracking for button/form variations
5. **Cohort Analysis**: Track user behavior patterns over time

This comprehensive tracking setup provides deep insights into user behavior, conversion paths, and areas for optimization across the AgentRadar platform.