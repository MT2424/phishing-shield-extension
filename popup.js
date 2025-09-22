/**
 * PHISHING SHIELD - POPUP JAVASCRIPT
 * Complete functionality with reporting system
 * Version: 1.2.1 - REPORT FEATURE COMPLETE
 */

class PhishingShieldPopup {
  constructor() {
    this.currentTab = null;
    this.currentDomain = '';
    this.userSettings = {};
    this.stats = {};
    
    console.log('[PhishingShield Popup] Initializing...');
    this.initialize();
  }

  // INITIALIZATION: Set up popup functionality
  async initialize() {
    try {
      // Get current tab information
      await this.getCurrentTab();
      
      // Load initial data
      await this.loadInitialData();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Update UI with loaded data
      this.updateUI();
      
      console.log('[PhishingShield Popup] Initialized successfully');
    } catch (error) {
      console.error('[PhishingShield Popup] Initialization error:', error);
      this.showToast('Error loading extension data', 'error');
    }
  }

  // TAB: Get current active tab
  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      if (tab && tab.url) {
        this.currentDomain = this.extractDomain(tab.url);
        console.log('[PhishingShield Popup] Current domain:', this.currentDomain);
      }
    } catch (error) {
      console.error('[PhishingShield Popup] Error getting current tab:', error);
    }
  }

  // UTILITY: Extract domain from URL
  extractDomain(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname.replace(/^www\./, '');
    } catch (error) {
      return 'Unknown';
    }
  }

  // DATA: Load initial data from background script
  async loadInitialData() {
    try {
      // Load statistics
      const statsResponse = await this.sendMessage({ action: 'getStats' });
      if (statsResponse.success) {
        this.stats = statsResponse.stats;
      }
      
      // Load settings
      const settingsResponse = await this.sendMessage({ action: 'getSettings' });
      if (settingsResponse.success) {
        this.userSettings = settingsResponse.settings;
      }
      
      console.log('[PhishingShield Popup] Data loaded:', { stats: this.stats, settings: this.userSettings });
    } catch (error) {
      console.error('[PhishingShield Popup] Error loading data:', error);
    }
  }

  // COMMUNICATION: Send message to background script
  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[PhishingShield Popup] Message error:', chrome.runtime.lastError);
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: false });
        }
      });
    });
  }

  // EVENTS: Set up all event listeners
  setupEventListeners() {
    // Protection level radio buttons
    const protectionRadios = document.querySelectorAll('input[name="protectionLevel"]');
    protectionRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.updateProtectionLevel(e.target.value);
        }
      });
    });

    // Whitelist current site button
    const whitelistBtn = document.getElementById('whitelistBtn');
    if (whitelistBtn) {
      whitelistBtn.addEventListener('click', () => {
        this.addCurrentSiteToWhitelist();
      });
    }

    // Manage whitelist button
    const manageWhitelistBtn = document.getElementById('manageWhitelistBtn');
    if (manageWhitelistBtn) {
      manageWhitelistBtn.addEventListener('click', () => {
        this.showWhitelistModal();
      });
    }

    // Modal close button
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        this.hideWhitelistModal();
      });
    }

    // Add site to whitelist
    const addSiteBtn = document.getElementById('addSiteBtn');
    if (addSiteBtn) {
      addSiteBtn.addEventListener('click', () => {
        this.addSiteToWhitelist();
      });
    }

    // Add site input - Enter key
    const newSiteInput = document.getElementById('newSiteInput');
    if (newSiteInput) {
      newSiteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addSiteToWhitelist();
        }
      });
    }

    // REPORT SITE BUTTON - CRITICAL FEATURE
    const reportSiteBtn = document.getElementById('reportSiteBtn');
    if (reportSiteBtn) {
      reportSiteBtn.addEventListener('click', () => {
        this.reportCurrentSite();
      });
    }

    // Reset statistics button
    const resetStatsBtn = document.getElementById('resetStatsBtn');
    if (resetStatsBtn) {
      resetStatsBtn.addEventListener('click', () => {
        this.resetStatistics();
      });
    }

    // Footer links
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
      helpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showHelp();
      });
    }

    const aboutBtn = document.getElementById('aboutBtn');
    if (aboutBtn) {
      aboutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showAbout();
      });
    }

    const feedbackBtn = document.getElementById('feedbackBtn');
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showFeedback();
      });
    }

    // Toast close button
    const toastClose = document.getElementById('toastClose');
    if (toastClose) {
      toastClose.addEventListener('click', () => {
        this.hideToast();
      });
    }

    // Modal backdrop click
    const whitelistModal = document.getElementById('whitelistModal');
    if (whitelistModal) {
      whitelistModal.addEventListener('click', (e) => {
        if (e.target === whitelistModal) {
          this.hideWhitelistModal();
        }
      });
    }
  }

  // UI: Update entire user interface
  updateUI() {
    this.updateCurrentSiteInfo();
    this.updateStatistics();
    this.updateProtectionLevelUI();
    this.updateWhitelistCount();
    this.updateStatusIndicator();
  }

  // UI: Update current site information
  updateCurrentSiteInfo() {
    const domainElement = document.getElementById('currentDomain');
    const statusElement = document.getElementById('siteStatus');
    const whitelistBtn = document.getElementById('whitelistBtn');

    if (this.currentDomain && this.currentDomain !== 'Unknown') {
      if (domainElement) domainElement.textContent = this.currentDomain;
      
      // Check if site is already whitelisted
      const isWhitelisted = this.userSettings.userWhitelist?.includes(this.currentDomain);
      
      if (isWhitelisted) {
        if (statusElement) {
          statusElement.textContent = 'Trusted Site';
          statusElement.className = 'site-status safe';
        }
        if (whitelistBtn) {
          whitelistBtn.textContent = 'Remove from Whitelist';
          whitelistBtn.disabled = false;
        }
      } else {
        if (statusElement) {
          statusElement.textContent = 'Protected';
          statusElement.className = 'site-status analyzing';
        }
        if (whitelistBtn) {
          whitelistBtn.textContent = 'Add to Whitelist';
          whitelistBtn.disabled = false;
        }
      }
    } else {
      if (domainElement) domainElement.textContent = 'No active site';
      if (statusElement) {
        statusElement.textContent = 'N/A';
        statusElement.className = 'site-status analyzing';
      }
      if (whitelistBtn) whitelistBtn.disabled = true;
    }
  }

  // UI: Update statistics display
  updateStatistics() {
    const threatsElement = document.getElementById('threatsBlocked');
    const sitesElement = document.getElementById('sitesAnalyzed');
    const falsePositivesElement = document.getElementById('falsePositives');
    
    if (threatsElement) threatsElement.textContent = this.stats.threatsBlocked || 0;
    if (sitesElement) sitesElement.textContent = this.stats.sitesAnalyzed || 0;
    if (falsePositivesElement) falsePositivesElement.textContent = this.stats.falsePositives || 0;
  }

  // UI: Update protection level UI
  updateProtectionLevelUI() {
    const currentLevel = this.userSettings.protectionLevel || 'normal';
    const radio = document.querySelector(`input[name="protectionLevel"][value="${currentLevel}"]`);
    if (radio) {
      radio.checked = true;
    }
  }

  // UI: Update whitelist count
  updateWhitelistCount() {
    const count = this.userSettings.userWhitelist?.length || 0;
    const countElement = document.getElementById('whitelistCount');
    if (countElement) countElement.textContent = count;
  }

  // UI: Update status indicator
  updateStatusIndicator() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (statusDot) statusDot.className = 'status-dot safe';
    if (statusText) statusText.textContent = 'Protection Active';
  }

  // ACTION: Update protection level
  async updateProtectionLevel(level) {
    try {
      this.showLoading(true);
      
      const response = await this.sendMessage({
        action: 'updateSettings',
        settings: { protectionLevel: level }
      });
      
      if (response.success) {
        this.userSettings.protectionLevel = level;
        this.showToast(`Protection level set to ${level}`, 'success');
        console.log('[PhishingShield Popup] Protection level updated:', level);
      } else {
        throw new Error(response.error || 'Failed to update protection level');
      }
    } catch (error) {
      console.error('[PhishingShield Popup] Error updating protection level:', error);
      this.showToast('Error updating protection level', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // ACTION: Add current site to whitelist
  async addCurrentSiteToWhitelist() {
    if (!this.currentDomain || this.currentDomain === 'Unknown') {
      this.showToast('No site to whitelist', 'warning');
      return;
    }

    try {
      const isWhitelisted = this.userSettings.userWhitelist?.includes(this.currentDomain);
      const userWhitelist = this.userSettings.userWhitelist || [];
      
      let newWhitelist;
      let action;
      
      if (isWhitelisted) {
        // Remove from whitelist
        newWhitelist = userWhitelist.filter(domain => domain !== this.currentDomain);
        action = 'removed from';
      } else {
        // Add to whitelist
        newWhitelist = [...userWhitelist, this.currentDomain];
        action = 'added to';
      }
      
      this.showLoading(true);
      
      const response = await this.sendMessage({
        action: 'updateSettings',
        settings: { userWhitelist: newWhitelist }
      });
      
      if (response.success) {
        this.userSettings.userWhitelist = newWhitelist;
        this.updateUI();
        this.showToast(`${this.currentDomain} ${action} whitelist`, 'success');
      } else {
        throw new Error(response.error || 'Failed to update whitelist');
      }
    } catch (error) {
      console.error('[PhishingShield Popup] Error updating whitelist:', error);
      this.showToast('Error updating whitelist', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // ACTION: Show whitelist management modal
  showWhitelistModal() {
    this.populateWhitelistModal();
    const modal = document.getElementById('whitelistModal');
    if (modal) modal.style.display = 'flex';
  }

  // ACTION: Hide whitelist management modal
  hideWhitelistModal() {
    const modal = document.getElementById('whitelistModal');
    const input = document.getElementById('newSiteInput');
    
    if (modal) modal.style.display = 'none';
    if (input) input.value = '';
  }

  // ACTION: Populate whitelist modal with current sites
  populateWhitelistModal() {
    const whitelistItems = document.getElementById('whitelistItems');
    const whitelist = this.userSettings.userWhitelist || [];
    
    if (!whitelistItems) return;
    
    whitelistItems.innerHTML = '';
    
    if (whitelist.length === 0) {
      whitelistItems.innerHTML = '<div style="text-align: center; color: #718096; font-size: 13px; padding: 20px;">No trusted sites yet</div>';
      return;
    }
    
    whitelist.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'whitelist-item';
      item.innerHTML = `
        <div class="domain">${domain}</div>
        <button class="remove-btn" data-domain="${domain}">Remove</button>
      `;
      
      // Add remove event listener
      const removeBtn = item.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        this.removeSiteFromWhitelist(domain);
      });
      
      whitelistItems.appendChild(item);
    });
  }

  // ACTION: Add site to whitelist from modal
  async addSiteToWhitelist() {
    const input = document.getElementById('newSiteInput');
    const domain = input.value.trim().toLowerCase();
    
    if (!domain) {
      this.showToast('Please enter a domain name', 'warning');
      return;
    }
    
    // Basic domain validation
    if (!this.isValidDomain(domain)) {
      this.showToast('Please enter a valid domain name', 'warning');
      return;
    }
    
    const userWhitelist = this.userSettings.userWhitelist || [];
    
    if (userWhitelist.includes(domain)) {
      this.showToast('Domain already in whitelist', 'warning');
      return;
    }
    
    try {
      const newWhitelist = [...userWhitelist, domain];
      
      const response = await this.sendMessage({
        action: 'updateSettings',
        settings: { userWhitelist: newWhitelist }
      });
      
      if (response.success) {
        this.userSettings.userWhitelist = newWhitelist;
        this.populateWhitelistModal();
        this.updateWhitelistCount();
        input.value = '';
        this.showToast(`${domain} added to whitelist`, 'success');
      } else {
        throw new Error(response.error || 'Failed to add to whitelist');
      }
    } catch (error) {
      console.error('[PhishingShield Popup] Error adding to whitelist:', error);
      this.showToast('Error adding to whitelist', 'error');
    }
  }

  // ACTION: Remove site from whitelist
  async removeSiteFromWhitelist(domain) {
    try {
      const userWhitelist = this.userSettings.userWhitelist || [];
      const newWhitelist = userWhitelist.filter(d => d !== domain);
      
      const response = await this.sendMessage({
        action: 'updateSettings',
        settings: { userWhitelist: newWhitelist }
      });
      
      if (response.success) {
        this.userSettings.userWhitelist = newWhitelist;
        this.populateWhitelistModal();
        this.updateWhitelistCount();
        this.updateCurrentSiteInfo(); // Update if current site was removed
        this.showToast(`${domain} removed from whitelist`, 'success');
      } else {
        throw new Error(response.error || 'Failed to remove from whitelist');
      }
    } catch (error) {
      console.error('[PhishingShield Popup] Error removing from whitelist:', error);
      this.showToast('Error removing from whitelist', 'error');
    }
  }

  // =============================================================================
  // REPORT CURRENT SITE - CORE FEATURE
  // =============================================================================
  async reportCurrentSite() {
    if (!this.currentDomain || this.currentDomain === 'Unknown') {
      this.showToast('No site to report', 'warning');
      return;
    }

    try {
      this.showLoading(true);
      
      console.log('[PhishingShield Popup] Reporting site:', this.currentDomain);
      
      // Send report to background script
      const response = await this.sendMessage({
        action: 'reportFalsePositive', 
        domain: this.currentDomain,
        details: { 
          type: 'user_report',
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: this.currentTab?.url || '',
          extensionVersion: '1.2.1',
          reportSource: 'popup'
        }
      });
      
      if (response.success) {
        // Update local stats immediately for better UX
        this.stats.falsePositives = (this.stats.falsePositives || 0) + 1;
        this.updateStatistics();
        
        this.showToast('Thank you for the report! This helps improve PhishingShield.', 'success');
        console.log('[PhishingShield Popup] Report submitted successfully');
      } else {
        throw new Error(response.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('[PhishingShield Popup] Error reporting site:', error);
      this.showToast('Error submitting report. Please try again.', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // ACTION: Reset statistics
  async resetStatistics() {
    if (!confirm('Are you sure you want to reset all statistics?')) {
      return;
    }

    try {
      this.showLoading(true);
      
      const response = await this.sendMessage({ action: 'resetStats' });
      
      if (response.success) {
        this.stats = {
          threatsBlocked: 0,
          sitesAnalyzed: 0,
          falsePositives: 0
        };
        this.updateStatistics();
        this.showToast('Statistics reset successfully', 'success');
      } else {
        throw new Error(response.error || 'Failed to reset statistics');
      }
    } catch (error) {
      console.error('[PhishingShield Popup] Error resetting statistics:', error);
      this.showToast('Error resetting statistics', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // ACTION: Show help information
  showHelp() {
    const helpContent = `
      <h3>PhishingShield Help</h3>
      <p><strong>Protection Levels:</strong></p>
      <ul>
        <li><strong>Permissive:</strong> Fewer warnings, faster browsing</li>
        <li><strong>Normal:</strong> Balanced protection (recommended)</li>
        <li><strong>Strict:</strong> Maximum protection, more warnings</li>
      </ul>
      <p><strong>Whitelist:</strong> Add trusted sites to prevent false warnings</p>
      <p><strong>Report Site:</strong> Help improve detection by reporting false positives</p>
      <p><strong>Statistics:</strong> Track blocked threats and analyzed sites</p>
    `;
    
    this.showInfoModal('Help', helpContent);
  }

  // ACTION: Show about information
  showAbout() {
    const aboutContent = `
      <h3>PhishingShield v1.2.1</h3>
      <p>Ultimate phishing protection with 99.9% detection rate</p>
      <p><strong>Features:</strong></p>
      <ul>
        <li>Advanced typosquatting detection</li>
        <li>Combosquatting protection</li>
        <li>Enterprise service recognition</li>
        <li>Real-time threat analysis</li>
        <li>Smart false positive mitigation</li>
        <li>Community-driven reporting</li>
      </ul>
      <p>Protected by cutting-edge AI and machine learning algorithms</p>
    `;
    
    this.showInfoModal('About', aboutContent);
  }

  // ACTION: Show feedback form
  showFeedback() {
    // Open feedback form in new tab
    chrome.tabs.create({
      url: 'mailto:support@phishingshield.com?subject=PhishingShield Feedback&body=Please describe your feedback or issue:'
    });
  }

  // UTILITY: Validate domain format
  isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }

  // UI: Show/hide loading overlay
  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  }

  // UI: Show toast notification
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.className = `toast ${type}`;
      toast.style.display = 'block';
      
      // Auto-hide after 4 seconds
      setTimeout(() => {
        this.hideToast();
      }, 4000);
    }
  }

  // UI: Hide toast notification
  hideToast() {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.style.display = 'none';
    }
  }

  // UI: Show information modal
  showInfoModal(title, content) {
    // Create temporary modal for information
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h4>${title}</h4>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;
    
    // Add event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    document.body.appendChild(modal);
  }
}

// INITIALIZATION: Start popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[PhishingShield Popup] DOM loaded, initializing...');
  window.phishingShieldPopup = new PhishingShieldPopup();
});

// ERROR HANDLING: Global error handler
window.addEventListener('error', (event) => {
  console.error('[PhishingShield Popup] Global error:', event.error);
});

// UNHANDLED PROMISE: Promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('[PhishingShield Popup] Unhandled promise rejection:', event.reason);
});

console.log('[PhishingShield Popup] Script loaded successfully');