# Cloudflare DNS Configuration for AgentRadar.app

## DNS Records Setup

Configure these DNS records in your Cloudflare dashboard for the `agentradar.app` domain:

### Core Application Records

```dns
# Main application (points to Vercel)
Type: CNAME
Name: @
Target: cname.vercel-dns.com
Proxy: ✅ Proxied (Orange Cloud)
TTL: Auto

# WWW redirect (points to Vercel) 
Type: CNAME
Name: www
Target: cname.vercel-dns.com  
Proxy: ✅ Proxied (Orange Cloud)
TTL: Auto

# API subdomain (for dedicated API if needed later)
Type: CNAME
Name: api
Target: cname.vercel-dns.com
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

### Optional Subdomains (Future Use)

```dns
# Admin panel (if separate deployment needed)
Type: CNAME
Name: admin
Target: cname.vercel-dns.com
Proxy: ✅ Proxied
TTL: Auto

# Status page
Type: CNAME  
Name: status
Target: cname.vercel-dns.com
Proxy: ✅ Proxied
TTL: Auto

# Development environment
Type: CNAME
Name: dev
Target: [separate-vercel-deployment]
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
4. **Vercel Domain**: Add `agentradar.app` in Vercel project settings
5. **Test HTTPS**: Ensure https://agentradar.app loads properly

## Important Notes

### Cloudflare + Vercel Integration
- Use **CNAME** records (not A records) to point to Vercel
- Keep **Proxy enabled** (Orange Cloud) for Cloudflare features
- Vercel handles SSL termination, Cloudflare provides the proxy layer

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
1. **522 Connection Timed Out**: Check Vercel deployment status
2. **SSL Certificate Issues**: Verify SSL/TLS mode is "Full (strict)"
3. **Redirect Loops**: Ensure Cloudflare proxy is enabled
4. **Cache Issues**: Purge Cloudflare cache after changes

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