# 🏠 MLS Integration Guide

## Overview

AgentRadar's MLS Integration system provides flexible, extensible access to Multiple Listing Service data through:

1. **Repliers MLS** - Primary integration partner providing standardized MLS data
2. **Bring-Your-Own-MLS** - Connect any MLS provider with custom configuration
3. **Multi-Provider Search** - Search across all configured providers simultaneously

## 🚀 Getting Started

### 1. Repliers Integration Setup

```bash
# Environment variables
REPLIERS_API_KEY=your_repliers_api_key_here
REPLIERS_ENDPOINT=https://api.repliers.ca/v1
REPLIERS_REGION=GTA
REPLIERS_RATE_LIMIT=100
```

### 2. Basic Property Search

```javascript
// Search properties across all providers
const response = await fetch('/api/mls/search?city=Toronto&maxResults=20', {
  headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' }
});

const data = await response.json();
console.log(`Found ${data.data.total} properties across all providers`);
```

### 3. Provider-Specific Search

```javascript
// Search only Repliers
const repliersOnly = await fetch('/api/mls/search?city=Toronto&provider=repliers', {
  headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' }
});

// Search specific custom provider
const customOnly = await fetch('/api/mls/search?city=Toronto&provider=my-custom-mls', {
  headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' }
});
```

## 🔧 Custom MLS Provider Setup

### Step 1: Test Provider Configuration

```javascript
// Test your MLS configuration before adding it
const testConfig = {
  endpoint: "https://your-mls-api.com/v1",
  authentication: {
    type: "bearer",
    token: "your_api_token"
  },
  mapping: {
    listingId: "id",
    address: "property_address",
    city: "location.city",
    price: "asking_price",
    bedrooms: "bedrooms",
    bathrooms: "bathrooms",
    propertyType: "category",
    listingDate: "created_date",
    status: "listing_status"
  }
};

const testResponse = await fetch('/api/mls/providers/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ADMIN_JWT_TOKEN'
  },
  body: JSON.stringify(testConfig)
});

if (testResponse.ok) {
  console.log('✅ Configuration test passed!');
}
```

### Step 2: Add Custom Provider

```javascript
// Add the tested provider to your system
const addProviderResponse = await fetch('/api/mls/providers/custom', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ADMIN_JWT_TOKEN'
  },
  body: JSON.stringify({
    providerId: "my-custom-mls",
    name: "My Custom MLS",
    ...testConfig,
    rateLimitRPM: 60,
    timeout: 30000
  })
});
```

## 🎯 API Reference

### Search Properties

**GET** `/api/mls/search`

Query Parameters:
- `city` (string) - Filter by city
- `province` (string) - Filter by province/state
- `minPrice` (number) - Minimum price
- `maxPrice` (number) - Maximum price
- `bedrooms` (number) - Number of bedrooms
- `bathrooms` (number) - Number of bathrooms
- `propertyType` (string) - Property type filter
- `maxResults` (number, default: 50) - Maximum results per provider
- `offset` (number, default: 0) - Pagination offset
- `provider` (string, optional) - Search specific provider only

**Response:**
```json
{
  "success": true,
  "data": {
    "repliers": [
      {
        "id": "12345",
        "address": "123 Main St",
        "city": "Toronto",
        "province": "ON",
        "price": 750000,
        "bedrooms": 3,
        "bathrooms": 2.5,
        "propertyType": "Detached",
        "listingDate": "2024-01-15T00:00:00Z",
        "daysOnMarket": 10,
        "status": "Active",
        "photos": ["photo1.jpg", "photo2.jpg"],
        "coordinates": {
          "lat": 43.6426,
          "lng": -79.3871
        },
        "provider": "repliers"
      }
    ],
    "custom": {
      "my-custom-mls": [
        // Custom provider results
      ]
    },
    "total": 15
  }
}
```

### Get Property Details

**GET** `/api/mls/listing/:id`

Query Parameters:
- `provider` (string, optional) - Specify provider if known

### Get Market Statistics

**GET** `/api/mls/market-stats`

Query Parameters:
- `region` (string, optional) - Region for stats
- `period` (string, default: "30d") - Time period (30d, 90d, 1y)

### Provider Management (Admin Only)

**GET** `/api/mls/providers` - Get all provider status
**POST** `/api/mls/providers/custom` - Add custom provider
**DELETE** `/api/mls/providers/custom/:providerId` - Remove custom provider
**POST** `/api/mls/providers/test` - Test provider configuration
**GET** `/api/mls/health` - Health check all providers

## 🏗️ Authentication Types

### Bearer Token
```json
{
  "type": "bearer",
  "token": "your_bearer_token_here"
}
```

### API Key
```json
{
  "type": "apikey",
  "apiKey": "your_api_key_here"
}
```

### Basic Authentication
```json
{
  "type": "basic",
  "username": "your_username",
  "password": "your_password"
}
```

### OAuth (Future)
```json
{
  "type": "oauth",
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret"
}
```

## 🗺️ Field Mapping Examples

### RETS Standard Format
```json
{
  "listingId": "ListingKey",
  "address": "UnparsedAddress", 
  "city": "City",
  "price": "ListPrice",
  "bedrooms": "BedroomsTotal",
  "bathrooms": "BathroomsTotalInteger",
  "propertyType": "PropertyType",
  "listingDate": "ListingContractDate",
  "status": "MlsStatus",
  "photos": "Photos",
  "coordinates": {
    "lat": "Latitude",
    "lng": "Longitude"
  }
}
```

### Custom JSON API
```json
{
  "listingId": "listing_number",
  "address": "property_address",
  "city": "location.city",
  "price": "current_price",
  "bedrooms": "specs.bedrooms",
  "bathrooms": "specs.bathrooms", 
  "propertyType": "category",
  "listingDate": "created_at",
  "status": "active_status",
  "photos": "media.photos"
}
```

### Nested Object Access
Use dot notation for nested fields:
```json
{
  "address": "property.location.street_address",
  "coordinates": {
    "lat": "geo_data.coordinates.latitude",
    "lng": "geo_data.coordinates.longitude"
  }
}
```

## ⚡ Performance & Caching

### Automatic Caching
- Search results: **15 minutes**
- Property details: **1 hour**
- Market statistics: **2 hours**

### Rate Limiting
- Repliers: **100 requests/minute** (configurable)
- Custom providers: **60 requests/minute** (configurable)
- Automatic retry with exponential backoff

### Performance Tips
1. Use appropriate `maxResults` limits
2. Leverage cached results when possible
3. Configure rate limits based on provider capacity
4. Use provider-specific searches when you know the source

## 🚨 Error Handling

### Common Error Scenarios

#### Authentication Failures
```json
{
  "success": false,
  "message": "MLS provider configuration test failed",
  "error": "Unauthorized: Invalid API key",
  "suggestions": [
    "Verify the API key is correct and active",
    "Check if the API key has sufficient permissions",
    "Ensure the authentication type matches provider requirements"
  ]
}
```

#### Rate Limiting
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "error": "Too many requests to provider 'custom-mls'",
  "retryAfter": 30
}
```

#### Provider Unavailable
```json
{
  "success": false,
  "message": "Provider temporarily unavailable",
  "error": "Connection timeout to https://custom-mls.com",
  "affectedProvider": "custom-mls"
}
```

## 🔧 Troubleshooting

### Configuration Issues

1. **Test endpoint accessibility:**
```bash
curl -X GET "https://your-mls-api.com/health" \
  -H "Authorization: Bearer your_token"
```

2. **Validate response format:**
```bash
curl -X GET "https://your-mls-api.com/search?limit=1" \
  -H "Authorization: Bearer your_token"
```

3. **Check field mapping:**
```javascript
// Get example configuration templates
const examples = await fetch('/api/mls/examples/config', {
  headers: { 'Authorization': 'Bearer YOUR_ADMIN_TOKEN' }
});
```

### Performance Issues

1. **Check provider health:**
```javascript
const health = await fetch('/api/mls/health', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
```

2. **Monitor rate limits:**
```javascript
const providers = await fetch('/api/mls/providers', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
```

## 🎉 Advanced Features

### Multi-Provider Aggregation
Search across all providers and get unified results with provider attribution.

### Intelligent Fallbacks
Automatic failover to alternative providers when primary sources are unavailable.

### Real-Time Updates
WebSocket notifications when new properties match your search criteria.

### Custom Data Enrichment
Automatic property valuation and market analysis using AI services.

### White-Label Support
Complete customization for brokerage-specific branding and data sources.

## 🔮 Future Enhancements

- **GraphQL API** - More flexible querying
- **Webhook Support** - Real-time property updates
- **Bulk Operations** - Efficient batch processing
- **Advanced Filtering** - Geospatial and complex criteria
- **Data Synchronization** - Offline-first mobile support

---

**Questions?** Contact our integration team or check the [API Documentation](/api) for more details.