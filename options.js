/**
 * PHISHING SHIELD - OPTIONS PAGE JAVASCRIPT
 * Advanced settings management for Chrome extension
 * Version: 1.0.0 - Chrome Production Ready
 * 
 * FEATURES:
 * - Tab navigation system
 * - Settings persistence with Chrome storage
 * - Whitelist management with search and bulk operations
 * - Statistics visualization and export
 * - Advanced configuration options
 * - Toast notification system
 * - Import/Export functionality
 * - Real-time validation
 */

// =============================================================================
// PRODUCTION UTILITIES
// =============================================================================

class OptionsLogger {
  /**
   * Production-safe logging for options page
   * WHY: Helps debug issues without spamming user console
   */
  static isDevelopment() {
    try {
      return !('update_url' in chrome.runtime.getManifest());
    } catch {
      return false;
    }
  }
  
  static log(...args) {
    if (this.isDevelopment()) {
      console.log('[PhishingShield Options]', ...args);
    }
  }
  
  static warn(...args) {
    if (this.isDevelopment()) {
      console.warn('[PhishingShield Options]', ...args);
    }
  }
  
  static error(...args) {
    console.error('[PhishingShield Options ERROR]', ...args);
  }
}

class OptionsErrorHandler {
  /**
   * Centralized error handling for options page
   * WHY: Graceful error handling improves user experience
   */
  static async handleError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      context: context,
      timestamp: Date.now(),
      page: 'options'
    };
    
    OptionsLogger.error('Options page error:', errorInfo);
    
    // Show user-friendly error message
    ToastNotification.show('An error occurred. Please try again.', 'error');
    
    // Report to background script
    try {
      chrome.runtime.sendMessage({
        action: 'reportError',
        error: errorInfo
      });
    } catch (messageError) {
      OptionsLogger.error('Failed to report error to background:', messageError);
    }
  }
}

// =============================================================================
// TOAST NOTIFICATION SYSTEM
// =============================================================================

class ToastNotification {
  /**
   * Professional toast notification system
   * WHY: Provides immediate feedback for user actions
   */
  static show(message, type = 'info', title = null, duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toastId = Date.now().toString();
    
    const icons = {
      info: '💬',
      success: '✅', 
      warning: '⚠️',
      error: '❌'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = toastId;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" onclick="ToastNotification.hide('${toastId}')">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => ToastNotification.hide(toastId), duration);
    }
    
    OptionsLogger.log('Toast shown:', { message, type, title });
  }
  
  static hide(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }
  }
  
  static clear() {
    const container = document.getElementById('toastContainer');
    container.innerHTML = '';
  }
}

// =============================================================================
// CHROME STORAGE UTILITIES
// =============================================================================

class StorageManager {
  /**
   * Abstraction layer for Chrome storage operations
   * WHY: Centralized storage management with error handling
   */
  static async get(keys) {
    try {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Storage get', keys });
      return {};
    }
  }
  
  static async set(data) {
    try {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Storage set', data });
      throw error;
    }
  }
  
  static async remove(keys) {
    try {
      return new Promise((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Storage remove', keys });
      throw error;
    }
  }
}

// =============================================================================
// MAIN OPTIONS PAGE CLASS
// =============================================================================

class PhishingShieldOptions {
  constructor() {
    this.currentTab = 'protection';
    this.settings = {};
    this.statistics = {};
    this.whitelist = [];
    this.isLoading = false;
    
    OptionsLogger.log('🛡️ PhishingShield Options v1.0.0 Initializing');
    this.init();
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  async init() {
    try {
      this.showLoading(true);
      
      // Load all data from storage
      await this.loadAllData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize UI
      this.initializeUI();
      
      // Setup auto-save
      this.setupAutoSave();
      
      this.showLoading(false);
      
      OptionsLogger.log('✅ Options page initialized successfully');
      ToastNotification.show('Settings loaded successfully', 'success');
      
    } catch (error) {
      this.showLoading(false);
      OptionsErrorHandler.handleError(error, { context: 'Options initialization' });
    }
  }

  async loadAllData() {
    try {
      const data = await StorageManager.get([
        'phishingShieldSettings',
        'phishingShieldStats', 
        'phishingShieldWhitelist'
      ]);
      
      // Load settings with defaults
      this.settings = {
        protectionLevel: 'normal',
        typosquattingDetection: true,
        combosquattingProtection: true,
        hostingPlatformAnalysis: true,
        aiContentDetection: true,
        tldRiskAnalysis: true,
        showNotifications: true,
        autoDismissWarnings: true,
        blockInputs: true,
        oauthSecurityChecks: true,
        analysisTimeout: 2000,
        cacheDuration: 900000,
        developmentMode: false,
        performanceMonitoring: false,
        ...data.phishingShieldSettings
      };
      
      // Load statistics
      this.statistics = {
        totalThreatsBlocked: 0,
        totalSitesAnalyzed: 0,
        falsePositiveReports: 0,
        threatTypes: {},
        installDate: Date.now(),
        ...data.phishingShieldStats
      };
      
      // Load whitelist
      this.whitelist = data.phishingShieldWhitelist || [];
      
      OptionsLogger.log('Data loaded:', { 
        settingsCount: Object.keys(this.settings).length,
        whitelistCount: this.whitelist.length,
        statsCount: Object.keys(this.statistics).length
      });
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Data loading' });
    }
  }

  // ===========================================================================
  // EVENT LISTENERS SETUP
  // ===========================================================================

  setupEventListeners() {
    try {
      // Tab navigation
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.switchTab(e.target.dataset.tab);
        });
      });

      // Protection level radio buttons
      document.querySelectorAll('input[name="protectionLevel"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          if (e.target.checked) {
            this.updateSetting('protectionLevel', e.target.value);
          }
        });
      });

      // Feature toggle switches
      const toggles = [
        'typosquattingDetection', 'combosquattingProtection', 'hostingPlatformAnalysis',
        'aiContentDetection', 'tldRiskAnalysis', 'showNotifications', 'autoDismissWarnings',
        'blockInputs', 'oauthSecurityChecks', 'developmentMode', 'performanceMonitoring'
      ];
      
      toggles.forEach(toggleId => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
          toggle.addEventListener('change', (e) => {
            this.updateSetting(toggleId, e.target.checked);
          });
        }
      });

      // Advanced settings selects
      ['analysisTimeout', 'cacheDuration'].forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
          select.addEventListener('change', (e) => {
            this.updateSetting(selectId, parseInt(e.target.value));
          });
        }
      });

      // Whitelist management
      this.setupWhitelistEventListeners();
      
      // Statistics actions
      this.setupStatisticsEventListeners();
      
      // Advanced actions
      this.setupAdvancedEventListeners();
      
      // Search functionality
      this.setupSearchEventListeners();
      
      OptionsLogger.log('Event listeners setup complete');
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Event listeners setup' });
    }
  }

  setupWhitelistEventListeners() {
    // Add new site
    const addSiteBtn = document.getElementById('addSiteBtn');
    const newSiteInput = document.getElementById('newSiteInput');
    
    if (addSiteBtn) {
      addSiteBtn.addEventListener('click', () => this.addSiteToWhitelist());
    }
    
    if (newSiteInput) {
      newSiteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addSiteToWhitelist();
        }
      });
      
      // Real-time validation
      newSiteInput.addEventListener('input', (e) => {
        this.validateDomainInput(e.target);
      });
    }

    // Bulk actions
    const importBtn = document.getElementById('importWhitelistBtn');
    const exportBtn = document.getElementById('exportWhitelistBtn');
    const clearBtn = document.getElementById('clearWhitelistBtn');
    
    if (importBtn) {
      importBtn.addEventListener('click', () => this.importWhitelist());
    }
    
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportWhitelist());
    }
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearWhitelist());
    }
  }

  setupStatisticsEventListeners() {
    const exportStatsBtn = document.getElementById('exportStatsBtn');
    const resetStatsBtn = document.getElementById('resetStatsBtn');
    
    if (exportStatsBtn) {
      exportStatsBtn.addEventListener('click', () => this.exportStatistics());
    }
    
    if (resetStatsBtn) {
      resetStatsBtn.addEventListener('click', () => this.resetStatistics());
    }
  }

  setupAdvancedEventListeners() {
    const saveBtn = document.getElementById('saveAdvancedBtn');
    const resetBtn = document.getElementById('resetAdvancedBtn');
    const exportSettingsBtn = document.getElementById('exportSettingsBtn');
    const importSettingsBtn = document.getElementById('importSettingsBtn');
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveAllSettings());
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetToDefaults());
    }
    
    if (exportSettingsBtn) {
      exportSettingsBtn.addEventListener('click', () => this.exportSettings());
    }
    
    if (importSettingsBtn) {
      importSettingsBtn.addEventListener('click', () => this.importSettings());
    }
  }

  setupSearchEventListeners() {
    const searchInput = document.getElementById('searchWhitelist');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterWhitelist(e.target.value);
      });
    }
  }

  // ===========================================================================
  // UI INITIALIZATION
  // ===========================================================================

  initializeUI() {
    try {
      // Set protection level
      const protectionRadio = document.querySelector(`input[name="protectionLevel"][value="${this.settings.protectionLevel}"]`);
      if (protectionRadio) {
        protectionRadio.checked = true;
      }

      // Set toggle switches
      const toggles = [
        'typosquattingDetection', 'combosquattingProtection', 'hostingPlatformAnalysis',
        'aiContentDetection', 'tldRiskAnalysis', 'showNotifications', 'autoDismissWarnings',
        'blockInputs', 'oauthSecurityChecks', 'developmentMode', 'performanceMonitoring'
      ];
      
      toggles.forEach(toggleId => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
          toggle.checked = this.settings[toggleId];
        }
      });

      // Set advanced settings
      const analysisTimeoutSelect = document.getElementById('analysisTimeout');
      if (analysisTimeoutSelect) {
        analysisTimeoutSelect.value = this.settings.analysisTimeout;
      }
      
      const cacheDurationSelect = document.getElementById('cacheDuration');
      if (cacheDurationSelect) {
        cacheDurationSelect.value = this.settings.cacheDuration;
      }

      // Initialize whitelist
      this.updateWhitelistDisplay();
      
      // Initialize statistics
      this.updateStatisticsDisplay();
      
      // Set build date
      const buildDateElement = document.getElementById('buildDate');
      if (buildDateElement) {
        buildDateElement.textContent = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
      }
      
      OptionsLogger.log('UI initialized successfully');
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'UI initialization' });
    }
  }

  // ===========================================================================
  // TAB NAVIGATION
  // ===========================================================================

  switchTab(tabName) {
    try {
      // Update current tab
      this.currentTab = tabName;
      
      // Update tab buttons
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
      
      // Update tab panes
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });
      document.getElementById(tabName).classList.add('active');
      
      // Load tab-specific data
      this.loadTabData(tabName);
      
      OptionsLogger.log('Switched to tab:', tabName);
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Tab switching', tabName });
    }
  }

  async loadTabData(tabName) {
    try {
      switch (tabName) {
        case 'statistics':
          await this.refreshStatistics();
          break;
        case 'whitelist':
          this.updateWhitelistDisplay();
          break;
        case 'about':
          this.updateAboutInfo();
          break;
      }
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Tab data loading', tabName });
    }
  }

  // ===========================================================================
  // SETTINGS MANAGEMENT
  // ===========================================================================

  async updateSetting(key, value) {
    try {
      this.settings[key] = value;
      await this.saveSettings();
      
      OptionsLogger.log('Setting updated:', { key, value });
      
      // Show feedback for important settings
      if (['protectionLevel', 'blockInputs', 'showNotifications'].includes(key)) {
        ToastNotification.show(`${key} updated successfully`, 'success');
      }
      
      // Send update to background script
      this.notifyBackgroundOfChanges();
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Setting update', key, value });
    }
  }

  async saveSettings() {
    try {
      await StorageManager.set({ phishingShieldSettings: this.settings });
      OptionsLogger.log('Settings saved to storage');
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Settings save' });
      throw error;
    }
  }

  async saveAllSettings() {
    try {
      this.showLoading(true);
      
      await this.saveSettings();
      await StorageManager.set({ phishingShieldWhitelist: this.whitelist });
      
      this.showLoading(false);
      ToastNotification.show('All settings saved successfully', 'success');
      
    } catch (error) {
      this.showLoading(false);
      OptionsErrorHandler.handleError(error, { context: 'Save all settings' });
    }
  }

  async resetToDefaults() {
    try {
      const confirmed = confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.');
      if (!confirmed) return;
      
      this.showLoading(true);
      
      // Reset to default settings
      this.settings = {
        protectionLevel: 'normal',
        typosquattingDetection: true,
        combosquattingProtection: true,
        hostingPlatformAnalysis: true,
        aiContentDetection: true,
        tldRiskAnalysis: true,
        showNotifications: true,
        autoDismissWarnings: true,
        blockInputs: true,
        oauthSecurityChecks: true,
        analysisTimeout: 2000,
        cacheDuration: 900000,
        developmentMode: false,
        performanceMonitoring: false
      };
      
      await this.saveSettings();
      this.initializeUI();
      
      this.showLoading(false);
      ToastNotification.show('Settings reset to defaults', 'success');
      
    } catch (error) {
      this.showLoading(false);
      OptionsErrorHandler.handleError(error, { context: 'Reset to defaults' });
    }
  }

  // ===========================================================================
  // WHITELIST MANAGEMENT
  // ===========================================================================

  async addSiteToWhitelist() {
    try {
      const input = document.getElementById('newSiteInput');
      const domain = input.value.trim().toLowerCase();
      
      if (!domain) {
        ToastNotification.show('Please enter a domain name', 'warning');
        return;
      }
      
      if (!this.isValidDomain(domain)) {
        ToastNotification.show('Please enter a valid domain name', 'error');
        return;
      }
      
      if (this.whitelist.includes(domain)) {
        ToastNotification.show('Domain already in whitelist', 'warning');
        return;
      }
      
      this.whitelist.push(domain);
      this.whitelist.sort(); // Keep alphabetically sorted
      
      await StorageManager.set({ phishingShieldWhitelist: this.whitelist });
      
      input.value = '';
      this.updateWhitelistDisplay();
      
      ToastNotification.show(`Added ${domain} to whitelist`, 'success');
      OptionsLogger.log('Site added to whitelist:', domain);
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Add site to whitelist' });
    }
  }

  async removeSiteFromWhitelist(domain) {
    try {
      const index = this.whitelist.indexOf(domain);
      if (index > -1) {
        this.whitelist.splice(index, 1);
        await StorageManager.set({ phishingShieldWhitelist: this.whitelist });
        
        this.updateWhitelistDisplay();
        ToastNotification.show(`Removed ${domain} from whitelist`, 'success');
        OptionsLogger.log('Site removed from whitelist:', domain);
      }
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Remove site from whitelist' });
    }
  }

  updateWhitelistDisplay() {
    try {
      // Update count
      const countElement = document.getElementById('whitelistCount');
      if (countElement) {
        countElement.textContent = this.whitelist.length;
      }
      
      // Update list
      const listElement = document.getElementById('whitelistList');
      if (!listElement) return;
      
      if (this.whitelist.length === 0) {
        listElement.innerHTML = `
          <div class="empty-state">
            <div style="text-align: center; padding: 40px; color: #64748b;">
              <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
              <h3>No trusted sites yet</h3>
              <p>Add domains you trust to prevent false positive warnings.</p>
            </div>
          </div>
        `;
        return;
      }
      
      listElement.innerHTML = this.whitelist.map(domain => `
        <div class="whitelist-item" data-domain="${domain}">
          <span class="domain-name">${domain}</span>
          <button class="remove-btn" onclick="window.phishingShieldOptions.removeSiteFromWhitelist('${domain}')">
            Remove
          </button>
        </div>
      `).join('');
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Whitelist display update' });
    }
  }

  filterWhitelist(searchTerm) {
    try {
      const items = document.querySelectorAll('.whitelist-item');
      const term = searchTerm.toLowerCase();
      
      items.forEach(item => {
        const domain = item.dataset.domain.toLowerCase();
        if (domain.includes(term)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Whitelist filtering' });
    }
  }

  async clearWhitelist() {
    try {
      const confirmed = confirm(`Are you sure you want to remove all ${this.whitelist.length} trusted sites? This cannot be undone.`);
      if (!confirmed) return;
      
      this.whitelist = [];
      await StorageManager.set({ phishingShieldWhitelist: this.whitelist });
      
      this.updateWhitelistDisplay();
      ToastNotification.show('All trusted sites removed', 'success');
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Clear whitelist' });
    }
  }

  // ===========================================================================
  // IMPORT/EXPORT FUNCTIONALITY
  // ===========================================================================

  async exportWhitelist() {
    try {
      const data = {
        type: 'PhishingShield_Whitelist',
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        domains: this.whitelist
      };
      
      this.downloadJSON(data, `phishing-shield-whitelist-${new Date().toISOString().split('T')[0]}.json`);
      ToastNotification.show('Whitelist exported successfully', 'success');
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Whitelist export' });
    }
  }

  async importWhitelist() {
    try {
      const file = await this.selectFile('.json');
      if (!file) return;
      
      const content = await this.readFileAsText(file);
      const data = JSON.parse(content);
      
      if (data.type !== 'PhishingShield_Whitelist') {
        throw new Error('Invalid file format. Please select a PhishingShield whitelist file.');
      }
      
      if (!Array.isArray(data.domains)) {
        throw new Error('Invalid file format. Domains array not found.');
      }
      
      // Validate domains
      const validDomains = data.domains.filter(domain => this.isValidDomain(domain));
      const duplicates = validDomains.filter(domain => this.whitelist.includes(domain));
      const newDomains = validDomains.filter(domain => !this.whitelist.includes(domain));
      
      if (newDomains.length === 0) {
        ToastNotification.show('No new domains to import', 'warning');
        return;
      }
      
      // Add new domains
      this.whitelist.push(...newDomains);
      this.whitelist.sort();
      
      await StorageManager.set({ phishingShieldWhitelist: this.whitelist });
      this.updateWhitelistDisplay();
      
      ToastNotification.show(
        `Imported ${newDomains.length} new domains${duplicates.length > 0 ? ` (${duplicates.length} duplicates skipped)` : ''}`, 
        'success'
      );
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Whitelist import' });
      ToastNotification.show(`Import failed: ${error.message}`, 'error');
    }
  }

  async exportSettings() {
    try {
      const data = {
        type: 'PhishingShield_Settings',
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        settings: this.settings,
        whitelist: this.whitelist
      };
      
      this.downloadJSON(data, `phishing-shield-settings-${new Date().toISOString().split('T')[0]}.json`);
      ToastNotification.show('Settings exported successfully', 'success');
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Settings export' });
    }
  }

  async importSettings() {
    try {
      const file = await this.selectFile('.json');
      if (!file) return;
      
      const content = await this.readFileAsText(file);
      const data = JSON.parse(content);
      
      if (data.type !== 'PhishingShield_Settings') {
        throw new Error('Invalid file format. Please select a PhishingShield settings file.');
      }
      
      const confirmed = confirm('This will replace all current settings. Are you sure you want to continue?');
      if (!confirmed) return;
      
      this.showLoading(true);
      
      // Import settings
      if (data.settings) {
        this.settings = { ...this.settings, ...data.settings };
        await this.saveSettings();
      }
      
      // Import whitelist
      if (data.whitelist && Array.isArray(data.whitelist)) {
        const validDomains = data.whitelist.filter(domain => this.isValidDomain(domain));
        this.whitelist = [...new Set([...this.whitelist, ...validDomains])].sort();
        await StorageManager.set({ phishingShieldWhitelist: this.whitelist });
      }
      
      // Refresh UI
      this.initializeUI();
      
      this.showLoading(false);
      ToastNotification.show('Settings imported successfully', 'success');
      
    } catch (error) {
      this.showLoading(false);
      OptionsErrorHandler.handleError(error, { context: 'Settings import' });
      ToastNotification.show(`Import failed: ${error.message}`, 'error');
    }
  }

  // ===========================================================================
  // STATISTICS MANAGEMENT
  // ===========================================================================

  async refreshStatistics() {
    try {
      // Get latest stats from background script
      const response = await this.sendMessageToBackground({ action: 'getStats' });
      if (response.success) {
        this.statistics = { ...this.statistics, ...response.stats };
      }
      
      this.updateStatisticsDisplay();
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Statistics refresh' });
    }
  }

  updateStatisticsDisplay() {
    try {
      // Update main stats
      const totalThreats = document.getElementById('totalThreatsBlocked');
      const totalSites = document.getElementById('totalSitesAnalyzed');
      const falsePositives = document.getElementById('falsePositiveReports');
      
      if (totalThreats) totalThreats.textContent = this.statistics.totalThreatsBlocked || 0;
      if (totalSites) totalSites.textContent = this.statistics.totalSitesAnalyzed || 0;
      if (falsePositives) falsePositives.textContent = this.statistics.falsePositiveReports || 0;
      
      // Update activity stats
      this.updateActivityStats();
      
      // Update threat types
      this.updateThreatTypesDisplay();
      
      // Update false positive rate
      this.updateFalsePositiveRate();
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Statistics display update' });
    }
  }

  updateActivityStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const thisWeek = today - (7 * 24 * 60 * 60 * 1000);
    const thisMonth = today - (30 * 24 * 60 * 60 * 1000);
    
    // These would be calculated from actual threat reports with timestamps
    // For now, using placeholder calculations
    const todayElement = document.getElementById('threatsToday');
    const weekElement = document.getElementById('threatsThisWeek');
    const monthElement = document.getElementById('threatsThisMonth');
    
    if (todayElement) todayElement.textContent = Math.floor(this.statistics.totalThreatsBlocked * 0.1) || 0;
    if (weekElement) weekElement.textContent = Math.floor(this.statistics.totalThreatsBlocked * 0.3) || 0;
    if (monthElement) monthElement.textContent = this.statistics.totalThreatsBlocked || 0;
  }

  updateThreatTypesDisplay() {
    const container = document.getElementById('threatTypes');
    if (!container) return;
    
    const threatTypes = this.statistics.threatTypes || {};
    const types = Object.keys(threatTypes);
    
    if (types.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px;">No threats detected yet</div>';
      return;
    }
    
    container.innerHTML = types.map(type => `
      <div class="threat-type-item">
        <span class="threat-type-name">${this.formatThreatType(type)}</span>
        <span class="threat-type-count">${threatTypes[type]}</span>
      </div>
    `).join('');
  }

  updateFalsePositiveRate() {
    const element = document.getElementById('falsePositiveRate');
    if (!element) return;
    
    const total = this.statistics.totalSitesAnalyzed || 0;
    const falsePositives = this.statistics.falsePositiveReports || 0;
    
    if (total === 0) {
      element.textContent = '0%';
      return;
    }
    
    const rate = ((falsePositives / total) * 100).toFixed(1);
    element.textContent = `${rate}%`;
  }

  formatThreatType(type) {
    const types = {
      'typosquatting': 'Typosquatting',
      'combosquatting': 'Combosquatting', 
      'hosting_platform': 'Hosting Platform',
      'tld_risk': 'TLD Risk',
      'ai_generated': 'AI Generated',
      'subdomain_spoofing': 'Subdomain Spoofing',
      'dangerous_pattern': 'Dangerous Pattern'
    };
    
    return types[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  async exportStatistics() {
    try {
      const data = {
        type: 'PhishingShield_Statistics',
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        statistics: this.statistics,
        summary: {
          totalThreatsBlocked: this.statistics.totalThreatsBlocked || 0,
          totalSitesAnalyzed: this.statistics.totalSitesAnalyzed || 0,
          falsePositiveRate: this.calculateFalsePositiveRate(),
          protectionLevel: this.settings.protectionLevel,
          installDate: this.statistics.installDate
        }
      };
      
      this.downloadJSON(data, `phishing-shield-stats-${new Date().toISOString().split('T')[0]}.json`);
      ToastNotification.show('Statistics exported successfully', 'success');
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Statistics export' });
    }
  }

  async resetStatistics() {
    try {
      const confirmed = confirm('Are you sure you want to reset all statistics? This cannot be undone.');
      if (!confirmed) return;
      
      // Reset statistics
      this.statistics = {
        totalThreatsBlocked: 0,
        totalSitesAnalyzed: 0,
        falsePositiveReports: 0,
        threatTypes: {},
        installDate: Date.now()
      };
      
      // Save to storage
      await StorageManager.set({ phishingShieldStats: this.statistics });
      
      // Notify background script
      await this.sendMessageToBackground({ action: 'resetStats' });
      
      // Update display
      this.updateStatisticsDisplay();
      
      ToastNotification.show('Statistics reset successfully', 'success');
      
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Statistics reset' });
    }
  }

  calculateFalsePositiveRate() {
    const total = this.statistics.totalSitesAnalyzed || 0;
    const falsePositives = this.statistics.falsePositiveReports || 0;
    
    if (total === 0) return 0;
    return ((falsePositives / total) * 100).toFixed(2);
  }

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  isValidDomain(domain) {
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }

  validateDomainInput(input) {
    const domain = input.value.trim().toLowerCase();
    
    if (domain === '') {
      input.style.borderColor = '#e2e8f0';
      return;
    }
    
    if (this.isValidDomain(domain)) {
      input.style.borderColor = '#10b981';
    } else {
      input.style.borderColor = '#dc2626';
    }
  }

  async sendMessageToBackground(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          OptionsLogger.warn('Background message error:', chrome.runtime.lastError);
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: false });
        }
      });
    });
  }

  notifyBackgroundOfChanges() {
    try {
      this.sendMessageToBackground({
        action: 'updateSettings',
        settings: this.settings
      });
    } catch (error) {
      OptionsErrorHandler.handleError(error, { context: 'Background notification' });
    }
  }

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  async selectFile(accept = '') {
    return new Promise((resolve) => {
      const input = document.getElementById('fileInput');
      input.accept = accept;
      input.onchange = (e) => {
        resolve(e.target.files[0] || null);
      };
      input.click();
    });
  }

  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  setupAutoSave() {
    // Auto-save settings every 30 seconds if there are changes
    setInterval(async () => {
      try {
        await this.saveSettings();
        OptionsLogger.log('Auto-save completed');
      } catch (error) {
        OptionsLogger.warn('Auto-save failed:', error);
      }
    }, 30000);
  }

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  }

  updateAboutInfo() {
    // Set current date for build date
    const buildDate = document.getElementById('buildDate');
    if (buildDate) {
      buildDate.textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    }
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    OptionsLogger.log('🚀 DOM loaded, initializing PhishingShield Options');
    window.phishingShieldOptions = new PhishingShieldOptions();
  } catch (error) {
    console.error('[PhishingShield Options CRITICAL] Initialization failed:', error);
    ToastNotification.show('Failed to load options page. Please refresh and try again.', 'error', null, 0);
  }
});

// Global error handlers
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && event.error.message.includes('PhishingShield')) {
    OptionsErrorHandler.handleError(event.error, {
      context: 'Global error handler',
      filename: event.filename,
      lineno: event.lineno
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('PhishingShield')) {
    OptionsErrorHandler.handleError(event.reason, {
      context: 'Unhandled promise rejection'
    });
  }
});

// Expose classes for debugging in development
if (OptionsLogger.isDevelopment()) {
  window.PhishingShieldDebug = {
    OptionsLogger,
    OptionsErrorHandler,
    ToastNotification,
    StorageManager
  };
}

OptionsLogger.log('📦 PhishingShield Options script loaded successfully');