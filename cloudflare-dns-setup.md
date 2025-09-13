# Cloudflare DNS Configuration for AgentRadar.app (AWS Deployment)

## DNS Records Setup

Configure these DNS records in your Cloudflare dashboard for the `agentradar.app` domain:

### Core Application Records

```dns
# Main application (points to AWS ALB)
Type: CNAME
Name: @
Target: your-main-alb-1234567890.us-east-1.elb.amazonaws.com
Proxy: ✅ Proxied (Orange Cloud)
TTL: Auto

# WWW redirect (points to AWS ALB) 
Type: CNAME
Name: www
Target: your-main-alb-1234567890.us-east-1.elb.amazonaws.com  
Proxy: ✅ Proxied (Orange Cloud)
TTL: Auto

# API subdomain (for dedicated API)
Type: CNAME
Name: api
Target: your-api-alb-0987654321.us-east-1.elb.amazonaws.com
Proxy: ✅ Proxied (Orange Cloud) 
TTL: Auto
```

### Verification & Email Records

```dns
# Domain verification (if required by Vercel)
Type: TXT
Name: @
Content: [Vercel will provide this value]
Proxy: ❌ DNS Only (Grey Cloud)
TTL: Auto

# Email configuration (for notifications)
Type: MX
Name: @
Target: mx1.improvmx.com
Priority: 10
Proxy: ❌ DNS Only
TTL: Auto

Type: MX  
Name: @
Target: mx2.improvmx.com
Priority: 20
Proxy: ❌ DNS Only
TTL: Auto

# Email forwarding verification
Type: TXT
Name: @
Content: v=spf1 include:spf.improvmx.com ~all
Proxy: ❌ DNS Only
TTL: Auto
```

### Required Platform Subdomains

```dns
# Admin Dashboard (Required - Administrative Interface)
Type: CNAME
Name: admin
Target: your-admin-alb-1111111111.us-east-1.elb.amazonaws.com
Proxy: ✅ Proxied
TTL: Auto

# Customer Dashboard (Required - Client Interface)
Type: CNAME
Name: dash
Target: your-dash-alb-2222222222.us-east-1.elb.amazonaws.com
Proxy: ✅ Proxied
TTL: Auto

# Support Portal (Required - Customer Support)
Type: CNAME  
Name: support
Target: your-support-alb-3333333333.us-east-1.elb.amazonaws.com
Proxy: ✅ Proxied
TTL: Auto

# Documentation (Required - Platform Documentation)
Type: CNAME
Name: docs
Target: your-docs-alb-4444444444.us-east-1.elb.amazonaws.com
Proxy: ✅ Proxied
TTL: Auto

# Blog Platform (Required - Content Marketing)
Type: CNAME
Name: blog
Target: your-blog-alb-5555555555.us-east-1.elb.amazonaws.com
Proxy: ✅ Proxied
TTL: Auto

# Community Hub (Required - User Community)
Type: CNAME
Name: community
Target: your-community-alb-6666666666.us-east-1.elb.amazonaws.com
Proxy: ✅ Proxied
TTL: Auto

# Status Monitor (Required - System Health)
Type: CNAME
Name: status
Target: your-status-alb-7777777777.us-east-1.elb.amazonaws.com
Proxy: ✅ Proxied
TTL: Auto

# Careers Portal (Required - HR/Recruitment)
Type: CNAME
Name: careers
Target: your-careers-alb-8888888888.us-east-1.elb.amazonaws.com
Proxy: ✅ Proxied
TTL: Auto
```

## Cloudflare Security Settings

### SSL/TLS Configuration
- **SSL/TLS encryption mode**: Full (strict)
- **Always Use HTTPS**: ✅ Enabled
- **HTTP Strict Transport Security (HSTS)**: ✅ Enabled
- **Minimum TLS Version**: 1.2
- **Opportunistic Encryption**: ✅ Enabled

### Security Settings
- **Security Level**: Medium
- **Bot Fight Mode**: ✅ Enabled  
- **Browser Integrity Check**: ✅ Enabled
- **Hotlink Protection**: ✅ Enabled

### Performance Settings
- **Caching Level**: Standard
- **Browser Cache TTL**: 4 hours
- **Always Online**: ✅ Enabled
- **Auto Minify**: CSS ✅, HTML ✅, JavaScript ✅
- **Brotli**: ✅ Enabled

### Page Rules (Optional Performance Optimization)

```
# Cache static assets aggressively
Pattern: agentradar.app/_next/static/*
Settings: Cache Level: Cache Everything, Edge Cache TTL: 1 month

# Cache API responses briefly
Pattern: agentradar.app/api/*  
Settings: Cache Level: Cache Everything, Edge Cache TTL: 5 minutes

# Don't cache dynamic pages
Pattern: agentradar.app/dashboard*
Settings: Cache Level: Bypass
```

## Verification Steps

After configuring DNS records:

1. **DNS Propagation**: Wait 15-30 minutes for DNS propagation
2. **Verify Resolution**: 
   ```bash
   nslookup agentradar.app
   nslookup www.agentradar.app
   ```

3. **SSL Certificate**: Cloudflare should auto-issue Universal SSL
4. **AWS Load Balancer**: Ensure ALB is configured with SSL certificate
5. **Test HTTPS**: Ensure https://agentradar.app loads properly

## Important Notes

### Cloudflare + AWS Integration
- Use **CNAME** records to point to AWS Application Load Balancer DNS names
- Keep **Proxy enabled** (Orange Cloud) for Cloudflare features
- AWS ALB handles SSL termination, Cloudflare provides the proxy layer
- ALB DNS names are stable and automatically resolve to healthy instances
- Example ALB format: `your-alb-name-1234567890.region.elb.amazonaws.com`

### Email Setup (Optional)
- The MX records use ImprovMX for free email forwarding
- Configure `noreply@agentradar.app` → your actual email
- Alternative: Use SendGrid domain authentication

### Security Considerations
- Enable **HSTS** for security headers
- Use **Full (strict)** SSL mode for end-to-end encryption
- Consider enabling **WAF rules** for additional protection

## Troubleshooting

### Common Issues
1. **522 Connection Timed Out**: Check AWS Load Balancer and target group health
2. **SSL Certificate Issues**: Verify SSL/TLS mode is "Full (strict)" and AWS ALB has valid certificate
3. **Redirect Loops**: Ensure Cloudflare proxy is enabled and AWS ALB is configured properly
4. **Cache Issues**: Purge Cloudflare cache after changes
5. **502 Bad Gateway**: Check AWS service health and security groups

### DNS Verification Commands
```bash
# Check DNS resolution
dig agentradar.app
dig www.agentradar.app CNAME

# Check SSL certificate
curl -I https://agentradar.app

# Test API endpoint
curl https://agentradar.app/api/health
```

This configuration provides optimal performance, security, and reliability for the AgentRadar platform.