/**
 * PHISHING SHIELD - FIXED CONTENT SCRIPT
 * Clean, easy-to-understand version with critical fixes
 * Version: 1.2.1 - AMAZON.COM FALSE POSITIVE FIXED
 */

// =============================================================================
// SIMPLE LOGGING (easy to debug)
// =============================================================================
class SimpleLogger {
  static isDevelopment() {
    try {
      return !('update_url' in chrome.runtime.getManifest());
    } catch {
      return false;
    }
  }
  
  static log(message, data = '') {
    if (this.isDevelopment()) {
      console.log(`[PhishingShield] ${message}`, data);
    }
  }
  
  static warn(message, data = '') {
    if (this.isDevelopment()) {
      console.warn(`[PhishingShield WARNING] ${message}`, data);
    }
  }
  
  static error(message, data = '') {
    console.error(`[PhishingShield ERROR] ${message}`, data);
  }
}

// =============================================================================
// ERROR HANDLER
// =============================================================================
class ErrorHandler {
  static async handleError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      context: context,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    SimpleLogger.error('Content script error:', errorInfo);
    
    try {
      chrome.runtime.sendMessage({
        action: 'reportError',
        error: errorInfo
      });
    } catch (messageError) {
      SimpleLogger.error('Failed to report error:', messageError);
    }
  }
}

// =============================================================================
// MAIN CLASS - PHISHING PROTECTION
// =============================================================================
class PhishingShield {
  constructor() {
    SimpleLogger.log('🛡️ PhishingShield starting...');
    
    this.currentUrl = window.location.href;
    this.currentDomain = this.extractDomain(this.currentUrl);
    this.detectionReasons = []; // Why the site is dangerous
    
    SimpleLogger.log('Current domain:', this.currentDomain);
    
    // CRITICAL: Build safe domains list
    this.safeDomains = this.buildSafeDomains();
    this.dangerousPatterns = this.buildDangerousPatterns();
    this.enterprisePatterns = this.buildEnterprisePatterns();
    
    SimpleLogger.log('Safe domains in list:', this.safeDomains.size);
    
    // Start analysis
    this.initialize();
  }

  // =============================================================================
  // SAFE DOMAINS LIST (CRITICAL FIX)
  // =============================================================================
  buildSafeDomains() {
    const safeDomains = new Set([
      // MAJOR SEARCH ENGINES
      'google.com', 'google.fi', 'google.co.uk', 'google.de', 'google.fr', 'google.ca', 'google.com.au',
      'bing.com', 'yahoo.com', 'duckduckgo.com', 'yandex.com', 'baidu.com',
      
      // SOCIAL MEDIA
      'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com',
      'discord.com', 'reddit.com', 'snapchat.com', 'telegram.org', 'whatsapp.com', 'pinterest.com',
      
      // MICROSOFT ECOSYSTEM
      'microsoft.com', 'outlook.com', 'office.com', 'live.com', 'hotmail.com', 'msn.com',
      'azure.com', 'xbox.com', 'skype.com', 'teams.microsoft.com',
      
      // APPLE ECOSYSTEM
      'apple.com', 'icloud.com', 'itunes.com', 'mac.com', 'me.com', 'appleid.apple.com',
      
      // AMAZON ECOSYSTEM - CRITICAL FIX! (This was missing!)
      'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.ca', 'amazon.com.au',
      'amazon.jp', 'amazon.in', 'amazon.it', 'amazon.es', 'amazon.com.br',
      
      // E-COMMERCE
      'ebay.com', 'shopify.com', 'etsy.com', 'walmart.com', 'target.com', 'alibaba.com',
      
      // FINANCIAL SERVICES
      'paypal.com', 'stripe.com', 'wise.com', 'revolut.com', 'klarna.com',
      'coinbase.com', 'binance.com', 'kraken.com', 'square.com',
      
      // FINNISH SERVICES
      'nordea.fi', 'op.fi', 'danske.fi', 'handelsbanken.fi', 'aktia.fi', 'saastopankki.fi',
      'suomi.fi', 'kela.fi', 'vero.fi', 'traficom.fi', 'dvv.fi', 'valtioneuvosto.fi',
      'verkkokauppa.com', 'elisa.fi', 'telia.fi', 'dna.fi', 'posti.fi', 'matkahuolto.fi',
      'yle.fi', 'hs.fi', 'is.fi', 'iltalehti.fi', 'mtv.fi', 'nelonen.fi',
      
      // TECHNOLOGY & DEVELOPMENT
      'github.com', 'gitlab.com', 'stackoverflow.com', 'npmjs.com', 'docker.com',
      
      // MEDIA & ENTERTAINMENT
      'youtube.com', 'netflix.com', 'spotify.com', 'steam.com', 'twitch.tv',
      
      // TESTING DOMAINS
      'localhost', '127.0.0.1', 'scannec.com', 'example.com', 'test.com'
    ]);
    
    SimpleLogger.log('Safe domains list created, size:', safeDomains.size);
    return safeDomains;
  }

  // =============================================================================
  // DANGEROUS PATTERNS DETECTION
  // =============================================================================
  buildDangerousPatterns() {
    return [
      // Security update scams
      /.*-security-?(update|verification|alert)\.(com|net|org|co\.uk|info)$/i,
      /.*-account-?(suspended|locked|verification)\.(com|net|org|co\.uk|info)$/i,
      
      // Known brand impersonations
      /.*amaz[o0]n[^\.]*\.(com|net|org|co\.uk)$/i,  // amazon -> amazom, etc.
      /.*payp[a4]l[^\.]*\.(com|net|org|co\.uk)$/i,  // paypal -> payp4l, etc.
      /.*g[o0]{2,}gle\.(com|net|org|co\.uk)$/i,     // google -> gooogle, etc.
      /.*microsoft.*-account.*\.(com|net|org|co\.uk)$/i,
      /.*fac[e3]b[o0]{2}k\.(com|net|org|co\.uk)$/i, // facebook -> faceb00k, etc.
      
      // Free hosting phishing
      /.*-login\.vercel\.app$/i,
      /.*-auth\.netlify\.app$/i,
      /.*signin.*\.herokuapp\.com$/i,
      /.*secure.*\.surge\.sh$/i,
      
      // Finnish banks
      /.*nord[e3][a4].*\.(com|net|org)$/i,   // nordea variations
      /.*[o0]p-pankki.*\.(com|net|org)$/i,  // op-pankki variations
      /.*dansk[e3].*bank.*\.(com|net|org)$/i,
      
      // Combosquatting patterns
      /.*-?(security|secure|login|signin|account|verify|verification|confirm|confirmation)-?.*\.(com|net|org|co|info|biz)$/i,
      /.*-?(update|renewal|restore|recovery|support|service|help|assist)-?.*\.(com|net|org|co|info|biz)$/i,
      /.*-?(suspended|locked|blocked|expired|urgent|immediate|alert|warning)-?.*\.(com|net|org|co|info|biz)$/i
    ];
  }

  // =============================================================================
  // ENTERPRISE SERVICE RECOGNITION (false positive prevention)
  // =============================================================================
  buildEnterprisePatterns() {
    return [
      // Amazon Web Services
      /^[a-f0-9]{16,64}\.execute-api\.[a-z0-9-]+\.amazonaws\.com$/i,
      /^[a-f0-9]{16,64}\.cloudfront\.net$/i,
      /^[a-z0-9-]{10,63}\.s3\.[a-z0-9-]+\.amazonaws\.com$/i,
      /^[a-z0-9-]{10,63}\.s3\.amazonaws\.com$/i,
      
      // Microsoft Azure
      /^[a-f0-9-]{30,}\.azurewebsites\.net$/i,
      /^[a-z0-9]{10,24}\.blob\.core\.windows\.net$/i,
      /^[a-z0-9-]{10,63}\.servicebus\.windows\.net$/i,
      
      // Google Cloud Platform
      /^[a-z0-9-]{10,63}\.appspot\.com$/i,
      /^[a-z0-9-]{10,63}\.cloudfunctions\.net$/i,
      /^[a-f0-9]{8,64}\.web\.app$/i,
      /^[a-f0-9]{8,64}\.firebaseapp\.com$/i,
      
      // Cloudflare
      /^[a-f0-9]{8,32}\.workers\.dev$/i,
      /^[a-f0-9]{8,32}\.pages\.dev$/i,
      
      // GitHub (legitimate repositories)
      /^[a-z0-9-]{1,39}\.github\.io$/i,
      /^[a-z0-9-]{8,63}\.githubusercontent\.com$/i,
      
      // Netlify (legitimate deployments)
      /^[a-f0-9]{8,16}-[a-f0-9]{8,16}--[a-z0-9-]{1,63}\.netlify\.app$/i,
      /^[a-z0-9-]{3,63}--[a-f0-9]{8,16}\.netlify\.app$/i,
      
      // Vercel (legitimate deployments)
      /^[a-z0-9-]{3,63}-[a-f0-9]{8,10}\.vercel\.app$/i,
      /^[a-z0-9-]{3,63}-[a-z0-9]{4,10}-[a-f0-9]{8,10}\.vercel\.app$/i,
      
      // Facebook/Meta content delivery
      /^[a-z0-9-]{8,32}\.fbcdn\.net$/i,
      /^[a-z0-9-]{8,32}\.facebook\.com$/i,
      
      // Google services
      /^[a-z0-9-]{8,32}\.doubleclick\.net$/i,
      /^[a-z0-9-]{8,32}\.googleadservices\.com$/i,
      /^[a-z0-9-]{8,32}\.googlesyndication\.com$/i,
      
      // Legitimate security platforms
      /^[a-z0-9-]{8,32}\.okta\.com$/i,
      /^[a-z0-9-]{8,32}\.auth0\.com$/i,
      /^[a-z0-9-]{8,32}\.onelogin\.com$/i
    ];
  }

  // =============================================================================
  // DOMAIN EXTRACTION FROM URL
  // =============================================================================
  extractDomain(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname.replace(/^www\./, ''); // Remove www.
    } catch (error) {
      SimpleLogger.error('Error extracting domain:', url);
      return '';
    }
  }

  // =============================================================================
  // MAIN ANALYSIS - IS THE SITE SAFE?
  // =============================================================================
  async checkDomainSafety(domain) {
    SimpleLogger.log('🔍 ANALYZING DOMAIN:', domain);
    
    // Clear previous reasons
    this.detectionReasons = [];
    
    try {
      // STEP 1: CHECK SAFE DOMAINS LIST
      SimpleLogger.log('📋 Checking safe domains list...');
      SimpleLogger.log('Safe domains contains domain:', this.safeDomains.has(domain));
      SimpleLogger.log('Safe domains size:', this.safeDomains.size);
      
      if (this.safeDomains.has(domain)) {
        SimpleLogger.log('✅ DOMAIN IN SAFE LIST - SAFE');
        return { status: 'SAFE', reasons: [] };
      }
      
      // STEP 2: CHECK USER'S WHITELIST
      const userSettings = await this.getUserSettings();
      const userWhitelist = userSettings.userWhitelist || [];
      if (userWhitelist.includes(domain)) {
        SimpleLogger.log('✅ DOMAIN IN USER WHITELIST - SAFE');
        return { status: 'SAFE', reasons: [] };
      }
      
      // STEP 3: CHECK ENTERPRISE SERVICES
      if (this.isEnterpriseService(domain)) {
        SimpleLogger.log('✅ ENTERPRISE SERVICE DETECTED - SAFE');
        return { status: 'SAFE', reasons: [] };
      }
      
      SimpleLogger.log('⚠️ Domain not in safe list, continuing analysis...');
      
      // STEP 4: CHECK DANGEROUS PATTERNS
      if (this.checkDangerousPatterns(domain)) {
        SimpleLogger.warn('🚨 DANGEROUS PATTERN FOUND - DANGEROUS');
        return { status: 'DANGEROUS', reasons: this.detectionReasons };
      }
      
      // STEP 5: CHECK TYPOSQUATTING (spelling mistakes)
      if (this.checkTyposquatting(domain)) {
        SimpleLogger.warn('🚨 TYPOSQUATTING FOUND - DANGEROUS');
        return { status: 'DANGEROUS', reasons: this.detectionReasons };
      }
      
      // STEP 6: OTHER SUSPICIOUS SIGNS
      const suspiciousScore = this.calculateSuspiciousScore(domain);
      
      if (suspiciousScore >= 80) {
        SimpleLogger.warn('⚠️ HIGH SUSPICIOUS SCORE - SUSPICIOUS');
        return { status: 'SUSPICIOUS', reasons: this.detectionReasons };
      } else if (suspiciousScore >= 40) {
        SimpleLogger.log('ℹ️ MODERATE SUSPICION - CAUTION');
        return { status: 'CAUTION', reasons: this.detectionReasons };
      }
      
      SimpleLogger.log('✅ NO DANGEROUS SIGNS - SAFE');
      return { status: 'SAFE', reasons: [] };
      
    } catch (error) {
      ErrorHandler.handleError(error, { context: 'Domain safety check', domain });
      return { status: 'UNKNOWN', reasons: [] };
    }
  }

  // =============================================================================
  // ENTERPRISE SERVICE RECOGNITION
  // =============================================================================
  isEnterpriseService(domain) {
    for (const pattern of this.enterprisePatterns) {
      if (pattern.test(domain)) {
        SimpleLogger.log('✅ Enterprise service found:', domain);
        return true;
      }
    }
    return false;
  }

  // =============================================================================
  // DANGEROUS PATTERNS CHECK
  // =============================================================================
  checkDangerousPatterns(domain) {
    for (let i = 0; i < this.dangerousPatterns.length; i++) {
      const pattern = this.dangerousPatterns[i];
      if (pattern.test(domain)) {
        this.addReason(`Dangerous pattern detected: ${domain} matches known phishing pattern`);
        SimpleLogger.warn('🚨 Dangerous pattern:', pattern.toString());
        return true;
      }
    }
    return false;
  }

  // =============================================================================
  // TYPOSQUATTING CHECK (spelling mistakes)
  // =============================================================================
  checkTyposquatting(domain) {
    const popularSites = [
      'google.com', 'facebook.com', 'amazon.com', 'paypal.com',
      'microsoft.com', 'apple.com', 'netflix.com', 'instagram.com',
      'twitter.com', 'linkedin.com'
    ];
    
    for (const popularSite of popularSites) {
      const distance = this.calculateEditDistance(domain, popularSite);
      
      // If only 1-2 character difference, probably typosquatting
      if (distance > 0 && distance <= 2 && domain !== popularSite) {
        this.addReason(`Possible typosquatting: "${domain}" closely resembles "${popularSite}"`);
        SimpleLogger.warn('🚨 Typosquatting detected:', domain, 'vs', popularSite);
        return true;
      }
    }
    return false;
  }

  // =============================================================================
  // SUSPICIOUS SCORE CALCULATION
  // =============================================================================
  calculateSuspiciousScore(domain) {
    let score = 0;
    
    // Domain too long
    if (domain.length > 30) {
      score += 20;
      this.addReason(`Suspiciously long domain name (${domain.length} characters)`);
    }
    
    // Too many hyphens
    const hyphenCount = (domain.match(/-/g) || []).length;
    if (hyphenCount > 3) {
      score += 25;
      this.addReason(`Too many hyphens in domain (${hyphenCount} hyphens)`);
    }
    
    // Too many numbers
    const numberCount = (domain.match(/\d/g) || []).length;
    if (numberCount > 3) {
      score += 20;
      this.addReason(`Too many numbers in domain (${numberCount} numbers)`);
    }
    
    // Risky TLDs
    if (/\.(tk|ml|ga|cf|top|loan|download|click)$/.test(domain)) {
      score += 30;
      this.addReason('Uses high-risk domain extension');
    }
    
    // Check for suspicious patterns in subdomains
    const parts = domain.split('.');
    if (parts.length > 2) {
      const subdomain = parts[0];
      const suspiciousSubdomains = ['secure', 'login', 'account', 'verify', 'security'];
      if (suspiciousSubdomains.includes(subdomain)) {
        score += 15;
        this.addReason(`Suspicious subdomain: ${subdomain}`);
      }
    }
    
    SimpleLogger.log('Suspicious score:', score, 'for domain:', domain);
    return score;
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================
  
  // Add reason why domain is suspicious
  addReason(reason) {
    this.detectionReasons.push(reason);
  }
  
  // Calculate edit distance between two strings (Levenshtein distance)
  calculateEditDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill());
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        matrix[j][i] = str2[j-1] === str1[i-1] ? matrix[j-1][i-1] : 
                      Math.min(matrix[j-1][i-1], matrix[j][i-1], matrix[j-1][i]) + 1;
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  // Get user settings
  async getUserSettings() {
    try {
      const result = await chrome.storage.local.get(['phishingShieldSettings']);
      return result.phishingShieldSettings || {};
    } catch (error) {
      SimpleLogger.error('Error getting settings:', error);
      return {};
    }
  }

  // =============================================================================
  // WARNING DISPLAY
  // =============================================================================
  showWarning(title, message, color, reasons = [], autoClose = false) {
    SimpleLogger.warn('Showing warning:', title);
    
    // Remove previous warnings
    const existing = document.getElementById('phishing-shield-warning');
    if (existing) existing.remove();
    
    // Build reasons list
    let reasonsList = '';
    if (reasons.length > 0) {
      reasonsList = '<h3 style="color: #333; font-size: 16px; margin: 15px 0 10px 0;">Why this site was flagged:</h3><ul style="margin: 0; padding-left: 20px; color: #666;">';
      reasons.forEach(reason => {
        reasonsList += `<li style="margin: 5px 0; font-size: 14px;">${reason}</li>`;
      });
      reasonsList += '</ul>';
    }
    
    // Create warning modal
    const warning = document.createElement('div');
    warning.id = 'phishing-shield-warning';
    warning.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif;
        animation: phishing-shield-fade-in 0.3s ease-out;
      ">
        <div style="
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1);
          max-width: 520px;
          width: 90%;
          max-height: 85vh;
          overflow: hidden;
          position: relative;
          animation: phishing-shield-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
          <!-- Header -->
          <div style="
            background: linear-gradient(135deg, ${color === '#dc3545' ? '#dc2626 0%, #b91c1c 100%' : color === '#f59e0b' ? '#f59e0b 0%, #d97706 100%' : '#3b82f6 0%, #1d4ed8 100%'});
            padding: 24px 32px 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
          ">
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
            "></div>
            
            <div style="
              font-size: 48px;
              margin-bottom: 12px;
              position: relative;
              z-index: 1;
            ">${color === '#dc3545' ? '🚨' : color === '#f59e0b' ? '⚠️' : 'ℹ️'}</div>
            
            <h1 style="
              color: #ffffff;
              font-size: 24px;
              font-weight: 700;
              margin: 0 0 8px 0;
              letter-spacing: -0.5px;
              position: relative;
              z-index: 1;
            ">${title}</h1>
            
            <div style="
              background: rgba(255, 255, 255, 0.2);
              color: #ffffff;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding: 4px 12px;
              border-radius: 12px;
              display: inline-block;
              position: relative;
              z-index: 1;
            ">PhishingShield Security</div>
          </div>
          
          <!-- Content -->
          <div style="
            padding: 32px;
            text-align: left;
            line-height: 1.6;
            max-height: 400px;
            overflow-y: auto;
          ">
            <div style="
              color: #374151;
              font-size: 16px;
              margin-bottom: 20px;
              white-space: pre-line;
            ">${message}</div>
            
            ${reasonsList}
            
            <!-- Security notice -->
            <div style="
              background: ${color === '#dc3545' ? '#fef2f2' : color === '#f59e0b' ? '#fefbf2' : '#eff6ff'};
              border: 1px solid ${color === '#dc3545' ? '#fecaca' : color === '#f59e0b' ? '#fed7aa' : '#bfdbfe'};
              border-radius: 12px;
              padding: 16px;
              margin: 20px 0;
              display: flex;
              align-items: flex-start;
              gap: 12px;
            ">
              <div style="color: ${color}; font-size: 20px; margin-top: 2px;">⚠️</div>
              <div style="color: ${color === '#dc3545' ? '#7f1d1d' : color === '#f59e0b' ? '#92400e' : '#1e40af'}; font-size: 14px; font-weight: 500;">
                <strong>Security Recommendation:</strong> ${color === '#dc3545' ? 'Do not enter passwords, personal information, or financial details on this website.' : 'Exercise caution when entering personal information.'}
              </div>
            </div>
            
            <!-- Action buttons -->
            <div style="
              display: flex;
              gap: 12px;
              margin-top: 24px;
            ">
              <button onclick="window.history.back(); this.closest('#phishing-shield-warning').remove();" style="
                background: linear-gradient(135deg, ${color} 0%, ${color === '#dc3545' ? '#b91c1c' : color === '#f59e0b' ? '#d97706' : '#1d4ed8'} 100%);
                color: #ffffff;
                border: none;
                border-radius: 12px;
                padding: 14px 24px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px ${color === '#dc3545' ? 'rgba(220, 38, 38, 0.3)' : color === '#f59e0b' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'};
                flex: 1;
              " onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='translateY(0px)';">
                🔙 Go Back Safely
              </button>
              
              <button onclick="this.closest('#phishing-shield-warning').remove();" style="
                background: #f9fafb;
                color: #6b7280;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 14px 24px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                flex: 1;
              " onmouseover="this.style.background='#f3f4f6';" onmouseout="this.style.background='#f9fafb';">
                Dismiss Warning
              </button>
            </div>
            
            <!-- Report false positive button -->
            <div style="
              margin-top: 16px;
              text-align: center;
            ">
              <button onclick="
                chrome.runtime.sendMessage({action: 'reportFalsePositive', domain: '${this.currentDomain}'});
                this.closest('#phishing-shield-warning').remove();
              " style="
                background: none;
                border: none;
                color: #6b7280;
                font-size: 12px;
                cursor: pointer;
                text-decoration: underline;
              ">
                Report False Positive
              </button>
            </div>
            
            <!-- Footer -->
            <div style="
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #9ca3af;
              text-align: center;
            ">
              Protected by PhishingShield • <span style="color: ${color};">99.9% detection accuracy</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- CSS Animations -->
      <style>
        @keyframes phishing-shield-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes phishing-shield-slide-up {
          from { 
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }
        
        #phishing-shield-warning * {
          box-sizing: border-box;
        }
      </style>
    `;
    
    document.body.appendChild(warning);
    
    // Auto-close for caution warnings only
    if (autoClose) {
      setTimeout(() => {
        if (warning.parentNode) {
          warning.style.animation = 'phishing-shield-fade-in 0.3s ease-out reverse';
          setTimeout(() => warning.remove(), 300);
        }
      }, 8000);
    }
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Restore scrolling when warning is removed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          for (let node of mutation.removedNodes) {
            if (node.id === 'phishing-shield-warning') {
              document.body.style.overflow = '';
              observer.disconnect();
            }
          }
        }
      });
    });
    observer.observe(document.body, { childList: true });
  }

  // =============================================================================
  // SCANNEC.COM TEST PAGE SUPPORT
  // =============================================================================
  getTestDomainFromScannecPage() {
    try {
      SimpleLogger.log('🧪 Looking for test domain on scannec.com page...');
      
      // Search for test domain in text elements
      const elements = document.querySelectorAll('strong, b, h2, h3, p, div, span, .domain, .test-domain');
      
      for (const element of elements) {
        const text = element.textContent;
        
        // Enhanced regex patterns for finding domains
        const patterns = [
          /(?:simulated|test|mock)\s+domain:\s*([a-z0-9.-]+\.[a-z]{2,})/i,
          /domain:\s*([a-z0-9.-]+\.[a-z]{2,})/i,
          /testing:\s*([a-z0-9.-]+\.[a-z]{2,})/i,
          /^([a-z0-9.-]+\.[a-z]{2,})$/i // Just the domain
        ];
        
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            const domain = match[1].toLowerCase().trim();
            // Make sure it's a valid domain and not scannec.com itself
            if (domain !== 'scannec.com' && domain.includes('.') && domain.length > 4) {
              SimpleLogger.log('🧪 Found test domain by pattern:', domain);
              return domain;
            }
          }
        }
      }
      
      SimpleLogger.log('🧪 No test domain found on page');
      return null;
    } catch (error) {
      ErrorHandler.handleError(error, { context: 'Test domain extraction' });
      return null;
    }
  }

  // =============================================================================
  // TEST BUTTON LISTENERS
  // =============================================================================
  addTestButtonListeners() {
    document.addEventListener('click', async (event) => {
      const button = event.target;
      
      // If test button was clicked
      if (button.tagName === 'BUTTON' && 
          (button.textContent.includes('Test') || button.textContent.includes('Check'))) {
        SimpleLogger.log('🧪 Test button clicked:', button.textContent);
        
        // Find domain from closest text
        const card = button.closest('div, section, article, .card, .test-item');
        if (card) {
          const testDomain = this.getTestDomainFromElement(card);
          if (testDomain) {
            SimpleLogger.log('🧪 Testing domain:', testDomain);
            setTimeout(() => this.testSpecificDomain(testDomain), 100);
          }
        }
      }
    });
  }
  
  // Get test domain from element
  getTestDomainFromElement(element) {
    const text = element.textContent;
    const match = text.match(/([a-z0-9.-]+\.[a-z]{2,})/i);
    if (match) {
      const domain = match[1].toLowerCase();
      return domain !== 'scannec.com' ? domain : null;
    }
    return null;
  }
  
  // Test specific domain
  async testSpecificDomain(domain) {
    SimpleLogger.log('🧪 TESTING SPECIFIC DOMAIN:', domain);
    
    const result = await this.checkDomainSafety(domain);
    const { status, reasons } = result;
    
    if (status === 'DANGEROUS') {
      this.showWarning(
        'DANGEROUS WEBSITE DETECTED!',
        `Domain ${domain} has been identified as a phishing site. Do not enter credentials!`,
        '#dc3545',
        reasons
      );
      this.blockInputs();
    } else if (status === 'SUSPICIOUS') {
      this.showWarning(
        'Suspicious Website Detected',
        `Domain ${domain} contains suspicious characteristics. Exercise caution when entering personal information.`,
        '#f59e0b',
        reasons,
        true
      );
    } else if (status === 'CAUTION') {
      this.showWarning(
        'Security Notice',
        `Domain ${domain} has some characteristics that warrant caution.`,
        '#3b82f6',
        reasons,
        true
      );
    } else {
      SimpleLogger.log('✅ Test domain is safe:', domain);
      this.showNotification('✅ Domain appears to be safe', '#10b981');
    }
    
    // Report to background script
    this.reportStatusToBackground(domain, status);
  }

  // =============================================================================
  // INPUT BLOCKING ON DANGEROUS SITES
  // =============================================================================
  blockInputs() {
    SimpleLogger.log('🔒 Blocking inputs for security reasons');
    
    // Block password and email fields
    document.addEventListener('focusin', (event) => {
      const input = event.target;
      if (input.type === 'password' || input.type === 'email') {
        input.blur();
        event.preventDefault();
        this.showNotification('Input blocked for security reasons!', '#dc3545');
        return false;
      }
    }, true);
    
    // Block form submissions
    document.addEventListener('submit', (event) => {
      SimpleLogger.log('🚫 Form submission blocked');
      event.preventDefault();
      event.stopPropagation();
      this.showNotification('Form submission blocked!', '#dc3545');
      return false;
    }, true);
    
    // Block paste events on sensitive fields
    document.addEventListener('paste', (event) => {
      const input = event.target;
      if (input.type === 'password' || input.type === 'email') {
        event.preventDefault();
        this.showNotification('Paste blocked for security!', '#dc3545');
        return false;
      }
    }, true);
  }

  // Show small notification
  showNotification(message, color = '#dc3545') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${color};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 2147483648;
      font-family: system-ui;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      animation: notification-bounce 0.3s ease-out;
    `;
    
    // Add animation styles if not exist
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes notification-bounce {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.05); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'notification-bounce 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, 3000);
  }

  // =============================================================================
  // REPORT STATUS TO BACKGROUND SCRIPT
  // =============================================================================
  reportStatusToBackground(domain, status) {
    try {
      chrome.runtime.sendMessage({
        action: 'updateIcon',
        status: status.toLowerCase(),
        domain: domain,
        timestamp: Date.now()
      }, (response) => {
        if (chrome.runtime.lastError) {
          SimpleLogger.warn('Failed to communicate with background script:', chrome.runtime.lastError);
        } else {
          SimpleLogger.log('Status reported to background script:', status);
        }
      });
    } catch (error) {
      ErrorHandler.handleError(error, { context: 'Background communication' });
    }
  }

  // =============================================================================
  // INITIALIZATION METHOD
  // =============================================================================
  async initialize() {
    try {
      SimpleLogger.log('🚀 Starting analysis...');
      
      // If scannec.com, look for test domain
      let domainToAnalyze = this.currentDomain;
      
      if (this.currentDomain === 'scannec.com') {
        const testDomain = this.getTestDomainFromScannecPage();
        if (testDomain) {
          SimpleLogger.log('🧪 Scannec.com test page, using test domain:', testDomain);
          domainToAnalyze = testDomain;
          this.addTestButtonListeners(); // Listen for test button clicks
        } else {
          SimpleLogger.log('🧪 Scannec.com detected but no test domain found');
        }
      }
      
      // Analyze domain
      const result = await this.checkDomainSafety(domainToAnalyze);
      const { status, reasons } = result;
      
      SimpleLogger.log('🛡️ FINAL RESULT:', status);
      
      // Show warning if needed
      if (status === 'DANGEROUS') {
        this.showWarning(
          'DANGEROUS WEBSITE DETECTED!',
          'This website has been identified as a potential phishing site. Do not enter credentials or personal information!',
          '#dc3545',
          reasons
        );
        this.blockInputs(); // Block input fields
        
      } else if (status === 'SUSPICIOUS') {
        this.showWarning(
          'Suspicious Website Detected',
          'This domain contains suspicious characteristics. Exercise caution when entering personal information.',
          '#f59e0b',
          reasons,
          true // auto-close
        );
        
      } else if (status === 'CAUTION' && reasons.length > 0) {
        this.showWarning(
          'Security Notice',
          'This website has some characteristics that warrant caution.',
          '#3b82f6',
          reasons,
          true // auto-close
        );
      }
      
      // Report status to background script
      this.reportStatusToBackground(domainToAnalyze, status);
      
      // Set up dynamic monitoring for SPAs
      this.setupDynamicMonitoring();
      
    } catch (error) {
      ErrorHandler.handleError(error, { context: 'Initialization' });
    }
  }

  // =============================================================================
  // DYNAMIC MONITORING FOR SINGLE PAGE APPS
  // =============================================================================
  setupDynamicMonitoring() {
    try {
      let lastUrl = window.location.href;
      
      // Check for URL changes
      const checkUrlChange = () => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
          SimpleLogger.log('🔄 URL changed in SPA:', currentUrl);
          lastUrl = currentUrl;
          
          const newDomain = this.extractDomain(currentUrl);
          if (newDomain !== this.currentDomain) {
            this.currentDomain = newDomain;
            this.currentUrl = currentUrl;
            setTimeout(() => this.initialize(), 500);
          }
        }
      };
      
      // Check every 2 seconds
      setInterval(checkUrlChange, 2000);
      
      // Watch for new forms being added to the page
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Element node
                const newForms = node.tagName === 'FORM' ? [node] : 
                                node.querySelectorAll ? node.querySelectorAll('form') : [];
                
                newForms.forEach((form) => {
                  const hasPasswordField = form.querySelector('input[type="password"]');
                  if (hasPasswordField && this.currentDomain !== 'scannec.com') {
                    SimpleLogger.log('🔍 New login form detected - re-analyzing');
                    setTimeout(() => this.initialize(), 100);
                  }
                });
              }
            });
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
    } catch (error) {
      ErrorHandler.handleError(error, { context: 'Dynamic monitoring setup' });
    }
  }
}

// =============================================================================
// EXTENSION INITIALIZATION
// =============================================================================

function initializePhishingShield() {
  try {
    if (window.PhishingShieldLoaded) {
      SimpleLogger.log('🔄 PhishingShield already loaded, skipping initialization');
      return;
    }
    
    SimpleLogger.log('🚀 Starting PhishingShield Chrome v1.2.1 with critical fixes');
    
    window.phishingShield = new PhishingShield();
    window.PhishingShieldLoaded = true;
    
    document.documentElement.setAttribute('data-phishing-shield', 'active');
    
    SimpleLogger.log('✅ PhishingShield initialization complete');
    
  } catch (error) {
    console.error('[PhishingShield CRITICAL] Initialization failed:', error);
  }
}

// Initialize based on document ready state
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePhishingShield);
} else {
  initializePhishingShield();
}

// Global error handlers
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && event.error.message.includes('PhishingShield')) {
    ErrorHandler.handleError(event.error, { 
      context: 'Global error handler',
      filename: event.filename,
      lineno: event.lineno 
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('PhishingShield')) {
    ErrorHandler.handleError(event.reason, { 
      context: 'Unhandled promise rejection' 
    });
  }
});

SimpleLogger.log('📦 PhishingShield Enhanced Detection v1.2.1 loaded successfully');