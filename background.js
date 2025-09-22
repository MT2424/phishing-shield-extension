/**
 * PHISHING SHIELD - ENHANCED BACKGROUND SERVICE WORKER
 * Handles extension lifecycle, icon updates, storage management, and reporting
 * Version: 1.2.1 - ENHANCED REPORTING SYSTEM
 */

class PhishingShieldBackground {
  constructor() {
    this.version = '1.2.1';
    this.stats = {
      threatsBlocked: 0,
      sitesAnalyzed: 0,
      falsePositives: 0,
      reportsSubmitted: 0 // NEW: Track total reports
    };
    
    console.log(`[PhishingShield Background v${this.version}] Service worker started`);
    this.initializeBackground();
  }

  // INITIALIZATION: Set up background service
  initializeBackground() {
    // Load stats from storage
    this.loadStats();
    
    // Listen for messages from content script and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
    
    // Handle extension installation/update
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });
    
    // Handle browser startup
    chrome.runtime.onStartup.addListener(() => {
      console.log('[PhishingShield Background] Extension startup detected');
      this.loadStats();
    });
    
    // Handle tab updates to reset icon
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading' && tab.url) {
        this.resetTabIcon(tabId);
      }
    });
  }

  // MESSAGE HANDLER: Process messages from content scripts and popup
  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('[PhishingShield Background] Received message:', message.action);
      
      switch (message.action) {
        case 'updateIcon':
          await this.updateExtensionIcon(message.status, sender.tab?.id);
          this.updateStats('sitesAnalyzed');
          if (message.status === 'dangerous') {
            this.updateStats('threatsBlocked');
          }
          sendResponse({ success: true });
          break;
          
        case 'getStats':
          sendResponse({ 
            success: true, 
            stats: this.stats 
          });
          break;
          
        case 'reportFalsePositive':
          console.log('[PhishingShield Background] Processing false positive report for:', message.domain);
          this.updateStats('falsePositives');
          this.updateStats('reportsSubmitted'); // NEW: Track all reports
          await this.handleFalsePositiveReport(message.domain, message.details);
          sendResponse({ 
            success: true, 
            message: 'Report submitted successfully',
            newStats: this.stats
          });
          break;
          
        case 'resetStats':
          await this.resetStats();
          sendResponse({ success: true, stats: this.stats });
          break;
          
        case 'updateSettings':
          await this.updateSettings(message.settings);
          sendResponse({ success: true });
          break;
          
        case 'getSettings':
          const settings = await this.getSettings();
          sendResponse({ success: true, settings });
          break;

        case 'reportError':
          await this.handleErrorReport(message.error);
          sendResponse({ success: true });
          break;
          
        default:
          console.warn('[PhishingShield Background] Unknown message action:', message.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('[PhishingShield Background] Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // ICON MANAGEMENT: Update extension icon based on threat level
  async updateExtensionIcon(status, tabId) {
    const iconConfigs = {
      'safe': {
        title: 'PhishingShield - Site is safe',
        badgeText: '',
        badgeColor: '#10b981'
      },
      'caution': {
        title: 'PhishingShield - Exercise caution',
        badgeText: '!',
        badgeColor: '#f59e0b'
      },
      'suspicious': {
        title: 'PhishingShield - Suspicious site detected',
        badgeText: '⚠',
        badgeColor: '#f59e0b'
      },
      'dangerous': {
        title: 'PhishingShield - DANGEROUS site blocked!',
        badgeText: '🚨',
        badgeColor: '#dc3545'
      }
    };
    
    const config = iconConfigs[status] || iconConfigs['safe'];
    
    try {
      // Update title for specific tab or all tabs
      if (tabId) {
        await chrome.action.setTitle({ 
          title: config.title, 
          tabId: tabId 
        });
        
        await chrome.action.setBadgeText({ 
          text: config.badgeText, 
          tabId: tabId 
        });
        
        if (config.badgeText) {
          await chrome.action.setBadgeBackgroundColor({ 
            color: config.badgeColor, 
            tabId: tabId 
          });
        }
      } else {
        await chrome.action.setTitle({ title: config.title });
        await chrome.action.setBadgeText({ text: config.badgeText });
        
        if (config.badgeText) {
          await chrome.action.setBadgeBackgroundColor({ color: config.badgeColor });
        }
      }
      
      console.log('[PhishingShield Background] Icon updated for status:', status);
      
    } catch (error) {
      console.error('[PhishingShield Background] Error updating icon:', error);
    }
  }

  // ICON MANAGEMENT: Reset icon for new page loads
  async resetTabIcon(tabId) {
    try {
      await chrome.action.setBadgeText({ text: '', tabId: tabId });
      await chrome.action.setTitle({ 
        title: 'PhishingShield - Analyzing...', 
        tabId: tabId 
      });
    } catch (error) {
      console.error('[PhishingShield Background] Error resetting icon:', error);
    }
  }

  // INSTALLATION: Handle extension install/update
  async handleInstallation(details) {
    console.log('[PhishingShield Background] Installation event:', details.reason);
    
    if (details.reason === 'install') {
      // First time installation
      await this.initializeDefaultSettings();
      console.log('[PhishingShield Background] First-time installation completed');
      
    } else if (details.reason === 'update') {
      // Extension updated
      const previousVersion = details.previousVersion;
      const currentVersion = chrome.runtime.getManifest().version;
      
      console.log(`[PhishingShield Background] Updated from ${previousVersion} to ${currentVersion}`);
      await this.handleVersionMigration(previousVersion, currentVersion);
    }
  }

  // INSTALLATION: Initialize default settings for new users
  async initializeDefaultSettings() {
    const defaultSettings = {
      protectionLevel: 'normal',
      userWhitelist: [],
      falsePositiveHistory: [],
      notificationsEnabled: true,
      reportingEnabled: true, // NEW: User can disable reporting
      installDate: Date.now()
    };
    
    try {
      await chrome.storage.local.set({ 
        phishingShieldSettings: defaultSettings,
        phishingShieldStats: this.stats
      });
      console.log('[PhishingShield Background] Default settings initialized');
    } catch (error) {
      console.error('[PhishingShield Background] Error initializing settings:', error);
    }
  }

  // MIGRATION: Handle version updates
  async handleVersionMigration(previousVersion, currentVersion) {
    try {
      // Add reportsSubmitted to existing stats if missing
      if (!this.stats.hasOwnProperty('reportsSubmitted')) {
        this.stats.reportsSubmitted = 0;
        await this.saveStats();
        console.log('[PhishingShield Background] Added reportsSubmitted to stats');
      }
      
      console.log(`[PhishingShield Background] Migration from ${previousVersion} to ${currentVersion} complete`);
    } catch (error) {
      console.error('[PhishingShield Background] Error during migration:', error);
    }
  }

  // STATS: Update usage statistics
  updateStats(metric) {
    if (this.stats.hasOwnProperty(metric)) {
      this.stats[metric]++;
      this.saveStats();
      console.log(`[PhishingShield Background] ${metric} updated to:`, this.stats[metric]);
    }
  }

  // STATS: Load statistics from storage
  async loadStats() {
    try {
      const result = await chrome.storage.local.get(['phishingShieldStats']);
      if (result.phishingShieldStats) {
        // Merge with default stats to handle new metrics
        this.stats = { 
          threatsBlocked: 0,
          sitesAnalyzed: 0,
          falsePositives: 0,
          reportsSubmitted: 0,
          ...result.phishingShieldStats 
        };
        console.log('[PhishingShield Background] Stats loaded:', this.stats);
      }
    } catch (error) {
      console.warn('[PhishingShield Background] Could not load stats:', error);
    }
  }

  // STATS: Save statistics to storage
  async saveStats() {
    try {
      await chrome.storage.local.set({ phishingShieldStats: this.stats });
    } catch (error) {
      console.warn('[PhishingShield Background] Could not save stats:', error);
    }
  }

  // STATS: Reset all statistics
  async resetStats() {
    this.stats = {
      threatsBlocked: 0,
      sitesAnalyzed: 0,
      falsePositives: 0,
      reportsSubmitted: 0
    };
    await this.saveStats();
    console.log('[PhishingShield Background] Statistics reset');
  }

  // REPORTING: Handle false positive reports
  async handleFalsePositiveReport(domain, details) {
    console.log('[PhishingShield Background] Processing false positive report for:', domain);
    
    try {
      // Create anonymized report
      const report = {
        domainHash: this.hashDomain(domain), // Anonymized for privacy
        timestamp: Date.now(),
        details: details || {},
        version: this.version,
        reportId: this.generateReportId()
      };
      
      // Store locally for analysis (keeping last 100 reports)
      const result = await chrome.storage.local.get(['falsePositiveReports']);
      const reports = result.falsePositiveReports || [];
      reports.push(report);
      
      // Keep only last 100 reports to prevent storage bloat
      if (reports.length > 100) {
        reports.splice(0, reports.length - 100);
      }
      
      await chrome.storage.local.set({ falsePositiveReports: reports });
      
      // Log for debugging (in development only)
      if (this.isDevelopment()) {
        console.log('[PhishingShield Background] Report stored:', {
          reportId: report.reportId,
          domain: domain, // Show real domain in development
          timestamp: new Date(report.timestamp).toISOString()
        });
      }
      
      console.log('[PhishingShield Background] False positive report processed successfully');
      
    } catch (error) {
      console.error('[PhishingShield Background] Error processing report:', error);
      throw error;
    }
  }

  // REPORTING: Handle error reports
  async handleErrorReport(errorInfo) {
    try {
      const errorReport = {
        ...errorInfo,
        reportId: this.generateReportId(),
        version: this.version
      };
      
      // Store error reports (keeping last 50)
      const result = await chrome.storage.local.get(['errorReports']);
      const reports = result.errorReports || [];
      reports.push(errorReport);
      
      if (reports.length > 50) {
        reports.splice(0, reports.length - 50);
      }
      
      await chrome.storage.local.set({ errorReports: reports });
      console.log('[PhishingShield Background] Error report stored');
      
    } catch (error) {
      console.error('[PhishingShield Background] Error storing error report:', error);
    }
  }

  // SETTINGS: Update user settings
  async updateSettings(newSettings) {
    try {
      const result = await chrome.storage.local.get(['phishingShieldSettings']);
      const currentSettings = result.phishingShieldSettings || {};
      
      const updatedSettings = { ...currentSettings, ...newSettings };
      
      await chrome.storage.local.set({ phishingShieldSettings: updatedSettings });
      console.log('[PhishingShield Background] Settings updated');
    } catch (error) {
      console.error('[PhishingShield Background] Error updating settings:', error);
      throw error;
    }
  }

  // SETTINGS: Get current settings
  async getSettings() {
    try {
      const result = await chrome.storage.local.get(['phishingShieldSettings']);
      return result.phishingShieldSettings || {};
    } catch (error) {
      console.error('[PhishingShield Background] Error getting settings:', error);
      return {};
    }
  }

  // UTILITY: Hash domain for privacy
  hashDomain(domain) {
    // Simple hash for anonymization
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      const char = domain.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // UTILITY: Generate unique report ID
  generateReportId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // UTILITY: Check if running in development
  isDevelopment() {
    try {
      return !('update_url' in chrome.runtime.getManifest());
    } catch {
      return false;
    }
  }

  // CLEANUP: Clean old data periodically
  async cleanupOldData() {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      // Clean old false positive reports
      const fpResult = await chrome.storage.local.get(['falsePositiveReports']);
      const fpReports = fpResult.falsePositiveReports || [];
      const cleanedFpReports = fpReports.filter(report => report.timestamp > thirtyDaysAgo);
      
      // Clean old error reports
      const errorResult = await chrome.storage.local.get(['errorReports']);
      const errorReports = errorResult.errorReports || [];
      const cleanedErrorReports = errorReports.filter(report => report.timestamp > thirtyDaysAgo);
      
      // Save cleaned data
      await chrome.storage.local.set({ 
        falsePositiveReports: cleanedFpReports,
        errorReports: cleanedErrorReports
      });
      
      const fpCleaned = fpReports.length - cleanedFpReports.length;
      const errorCleaned = errorReports.length - cleanedErrorReports.length;
      
      if (fpCleaned > 0 || errorCleaned > 0) {
        console.log(`[PhishingShield Background] Cleaned ${fpCleaned} old FP reports and ${errorCleaned} old error reports`);
      }
      
    } catch (error) {
      console.warn('[PhishingShield Background] Error cleaning old data:', error);
    }
  }

  // PERIODIC TASKS: Run maintenance tasks
  async runPeriodicTasks() {
    await this.cleanupOldData();
    await this.saveStats(); // Ensure stats are persisted
  }
}

// INITIALIZATION: Start the background service
console.log('[PhishingShield] Initializing background service worker');
const phishingShieldBackground = new PhishingShieldBackground();

// PERIODIC MAINTENANCE: Run cleanup tasks every hour
setInterval(() => {
  phishingShieldBackground.runPeriodicTasks();
}, 60 * 60 * 1000); // Every hour

// ERROR HANDLING: Global error handler
self.addEventListener('error', (event) => {
  console.error('[PhishingShield Background] Global error:', event.error);
});

// PROMISE REJECTION: Handle unhandled rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('[PhishingShield Background] Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

console.log('[PhishingShield Background v1.2.1] Service worker initialized successfully with enhanced reporting');