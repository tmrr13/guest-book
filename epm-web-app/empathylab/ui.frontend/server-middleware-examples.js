/**
 * Server Middleware Examples for HSTS Implementation
 * 
 * These examples show how to properly implement HSTS headers
 * at the server level to fix the Missing_HSTS_Header vulnerability
 */

// ============================================================================
// Express.js / Node.js Implementation Examples
// ============================================================================

// Method 1: Using Helmet (Recommended)
const express = require('express');
const helmet = require('helmet');

const app = express();

// Configure Helmet with HSTS
app.use(helmet({
  hsts: {
    maxAge: 31536000,        // 1 year in seconds (minimum recommended)
    includeSubDomains: true, // Apply to all subdomains
    preload: true           // Allow inclusion in HSTS preload lists
  },
  // Additional security headers
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// ============================================================================

// Method 2: Using dedicated HSTS package
const hsts = require('hsts');

app.use(hsts({
  maxAge: 31536000,        // 1 year
  includeSubDomains: true,
  preload: true,
  setIf: function (req, res) {
    // Only set HSTS for HTTPS requests
    return req.secure || req.headers['x-forwarded-proto'] === 'https';
  }
}));

// ============================================================================

// Method 3: Manual HSTS header implementation
app.use((req, res, next) => {
  // Only set HSTS header for HTTPS requests
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  next();
});

// ============================================================================

// Method 4: Advanced HSTS with environment-based configuration
const HSTS_CONFIG = {
  development: {
    maxAge: 300,           // 5 minutes for development
    includeSubDomains: false,
    preload: false
  },
  staging: {
    maxAge: 86400,         // 1 day for staging
    includeSubDomains: true,
    preload: false
  },
  production: {
    maxAge: 31536000,      // 1 year for production
    includeSubDomains: true,
    preload: true
  }
};

const environment = process.env.NODE_ENV || 'development';
const hstsConfig = HSTS_CONFIG[environment];

app.use(helmet({
  hsts: hstsConfig
}));

// ============================================================================

// Method 5: Custom middleware with logging
function secureHeaders(req, res, next) {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  
  if (isSecure) {
    const hstsValue = 'max-age=31536000; includeSubDomains; preload';
    res.setHeader('Strict-Transport-Security', hstsValue);
    
    // Log HSTS header setting for monitoring
    console.log(`HSTS header set for ${req.url}: ${hstsValue}`);
  } else {
    // Log warning for non-HTTPS requests
    console.warn(`⚠️ Non-HTTPS request to ${req.url} - HSTS not applicable`);
  }
  
  next();
}

app.use(secureHeaders);

// ============================================================================
// Additional Security Middleware
// ============================================================================

// Redirect HTTP to HTTPS (should be done before HSTS)
app.use((req, res, next) => {
  if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
    const redirectURL = `https://${req.headers.host}${req.url}`;
    console.log(`Redirecting HTTP to HTTPS: ${redirectURL}`);
    return res.redirect(301, redirectURL);
  }
  next();
});

// Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  next();
});

// X-Frame-Options
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// X-Content-Type-Options
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// ============================================================================
// Route Handler Examples with HSTS Validation
// ============================================================================

// Download endpoint that the DownloadFormValidation.ts would call
app.post('/api/download', (req, res) => {
  try {
    // Validate that HSTS is properly set
    const hstsHeader = res.getHeader('Strict-Transport-Security');
    if (!hstsHeader) {
      console.error('⚠️ HSTS header missing from response');
    }
    
    // Process download request
    const { filename, fileType, size, metadata } = req.body;
    
    // Validation logic here...
    
    // Send response (this corresponds to the line 98 vulnerability)
    res.json({
      success: true,
      data: {
        downloadUrl: `/secure-download/${filename}`,
        expires: new Date(Date.now() + 3600000), // 1 hour
        fileType,
        size
      },
      message: 'Download prepared successfully'
    });
    
  } catch (error) {
    console.error('Download endpoint error:', error);
    res.status(500).json({
      success: false,
      errors: [{
        field: 'general',
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }]
    });
  }
});

// Health check endpoint for HSTS monitoring
app.get('/health/security', (req, res) => {
  const hstsHeader = res.getHeader('Strict-Transport-Security');
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  
  res.json({
    secure: isSecure,
    hsts: {
      enabled: !!hstsHeader,
      value: hstsHeader || null
    },
    headers: {
      'Strict-Transport-Security': hstsHeader,
      'X-Frame-Options': res.getHeader('X-Frame-Options'),
      'X-Content-Type-Options': res.getHeader('X-Content-Type-Options')
    }
  });
});

// ============================================================================
// Server Startup
// ============================================================================

const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// HTTP server (for redirects only)
const http = require('http');
const httpServer = http.createServer(app);

// HTTPS server (main application)
const https = require('https');
const fs = require('fs');

// SSL certificate configuration (update paths as needed)
const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/key.pem'),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/cert.pem')
};

const httpsServer = https.createServer(httpsOptions, app);

// Start servers
httpServer.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT} (redirects to HTTPS)`);
});

httpsServer.listen(HTTPS_PORT, () => {
  console.log(`HTTPS server running on port ${HTTPS_PORT}`);
  console.log(`✅ HSTS enabled with max-age=${hstsConfig.maxAge}`);
});

module.exports = app;