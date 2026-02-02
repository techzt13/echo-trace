/**
 * EchoTrace Background Service Worker
 * Handles tab tracking, idle detection, history processing, and stats calculation
 */

// Domain to category mapping
const DOMAIN_CATEGORIES = {
  social: ['x.com', 'twitter.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'reddit.com', 'linkedin.com'],
  news: ['cnn.com', 'bbc.com', 'nytimes.com', 'theguardian.com', 'bloomberg.com'],
  productivity: ['notion.so', 'github.com', 'stackoverflow.com', 'docs.google.com', 'linear.app', 'figma.com'],
  entertainment: ['youtube.com', 'netflix.com', 'twitch.tv'],
};

// Global state for tracking
let trackingState = {
  enabled: false,
  currentTab: null,
  currentDomain: null,
  lastActiveTime: null,
  sessionStart: null,
};

/**
 * Initialize extension on startup
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('EchoTrace installed');
  
  // Initialize storage structure (won't overwrite existing enabled state)
  await initializeStorage();
  
  // Load current state
  const data = await chrome.storage.local.get(['enabled']);
  trackingState.enabled = data.enabled ?? false;
  
  // Create periodic alarm for background updates
  await chrome.alarms.create('processStats', { periodInMinutes: 5 });
});

/**
 * Initialize storage with empty structure if needed
 */
async function initializeStorage() {
  const data = await chrome.storage.local.get(null);
  
  // Only initialize missing fields, don't overwrite existing ones
  const updates = {};
  
  if (data.enabled === undefined) updates.enabled = false;
  if (!data.dailyStats) updates.dailyStats = {};
  if (!data.totalByDomain) updates.totalByDomain = {};
  if (!data.totalByCategory) updates.totalByCategory = {};
  if (!data.sessionHistory) updates.sessionHistory = [];
  
  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return null;
  }
}

/**
 * Categorize a domain
 */
function categorizeDomain(domain) {
  if (!domain) return 'other';
  
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.some(d => domain.includes(d) || d.includes(domain))) {
      return category;
    }
  }
  return 'other';
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayKey() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Accumulate time for current session
 */
async function flushCurrentSession() {
  if (!trackingState.sessionStart || !trackingState.currentDomain) {
    return;
  }
  
  const now = Date.now();
  const elapsedSeconds = Math.round((now - trackingState.sessionStart) / 1000);
  
  if (elapsedSeconds > 0) {
    await addTimeToStats(trackingState.currentDomain, elapsedSeconds);
  }
  
  // Reset session timer
  trackingState.sessionStart = now;
}

/**
 * Add time to statistics
 */
async function addTimeToStats(domain, seconds) {
  const today = getTodayKey();
  const category = categorizeDomain(domain);
  
  const data = await chrome.storage.local.get(['dailyStats', 'totalByDomain', 'totalByCategory']);
  
  // Initialize today's entry if needed
  if (!data.dailyStats[today]) {
    data.dailyStats[today] = {};
  }
  if (!data.dailyStats[today][category]) {
    data.dailyStats[today][category] = 0;
  }
  
  // Update daily category stats
  data.dailyStats[today][category] += seconds;
  
  // Update total by domain
  data.totalByDomain[domain] = (data.totalByDomain[domain] || 0) + seconds;
  
  // Update total by category
  data.totalByCategory[category] = (data.totalByCategory[category] || 0) + seconds;
  
  await chrome.storage.local.set({
    dailyStats: data.dailyStats,
    totalByDomain: data.totalByDomain,
    totalByCategory: data.totalByCategory,
  });
}

/**
 * Track active tab changes
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!trackingState.enabled) return;
  
  // Flush previous session
  await flushCurrentSession();
  
  // Start tracking new tab
  const tab = await chrome.tabs.get(activeInfo.tabId);
  trackingState.currentTab = activeInfo.tabId;
  trackingState.currentDomain = extractDomain(tab.url);
  trackingState.sessionStart = Date.now();
  
  console.log('Tab activated:', trackingState.currentDomain);
});

/**
 * Track tab updates
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!trackingState.enabled || trackingState.currentTab !== tabId) return;
  
  if (changeInfo.url) {
    // URL changed, flush and start new session
    await flushCurrentSession();
    trackingState.currentDomain = extractDomain(tab.url);
    trackingState.sessionStart = Date.now();
    console.log('Tab URL updated:', trackingState.currentDomain);
  }
});

/**
 * Track tab removal
 */
chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (trackingState.currentTab === tabId && trackingState.enabled) {
    await flushCurrentSession();
    trackingState.currentTab = null;
    trackingState.currentDomain = null;
    trackingState.sessionStart = null;
  }
});

/**
 * Detect idle state and pause tracking
 */
chrome.idle.onStateChanged.addListener(async (newState) => {
  if (!trackingState.enabled) return;
  
  if (newState === 'idle' || newState === 'locked') {
    console.log('User idle/locked, pausing tracking');
    await flushCurrentSession();
    trackingState.sessionStart = null;
  } else if (newState === 'active') {
    console.log('User active again, resuming tracking');
    if (trackingState.currentDomain) {
      trackingState.sessionStart = Date.now();
    }
  }
});

/**
 * Process stats periodically
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'processStats') {
    console.log('Processing stats');
    
    // Flush current session if tracking
    if (trackingState.enabled && trackingState.currentTab) {
      await flushCurrentSession();
      trackingState.sessionStart = Date.now();
    }
    
    // Process historical data from chrome.history (optional, can be added later)
    // For now, just keep the periodic flush going
  }
});

/**
 * Listen for tracking toggle from popup/newtab
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle async operations properly
  (async () => {
    try {
      if (request.action === 'toggleTracking') {
        trackingState.enabled = request.enabled;
        await chrome.storage.local.set({ enabled: request.enabled });
        
        if (!request.enabled) {
          // Stop current session
          await flushCurrentSession();
          trackingState.sessionStart = null;
        } else {
          // Start tracking from now
          if (trackingState.currentDomain) {
            trackingState.sessionStart = Date.now();
          }
        }
        
        console.log('Tracking toggled:', request.enabled);
        sendResponse({ success: true, enabled: trackingState.enabled });
      } else if (request.action === 'getStats') {
        const data = await chrome.storage.local.get(['dailyStats', 'totalByDomain', 'totalByCategory', 'enabled']);
        console.log('Sending stats to popup/dashboard:', data);
        sendResponse(data);
      } else if (request.action === 'resetData') {
        await chrome.storage.local.set({
          enabled: trackingState.enabled,
          dailyStats: {},
          totalByDomain: {},
          totalByCategory: {},
        });
        console.log('Data reset');
        sendResponse({ success: true });
      }
    } catch (error) {
      console.error('Error handling message:', request.action, error);
      sendResponse({ error: error.message });
    }
  })();
  
  // Return true to indicate we'll send response asynchronously
  return true;
});

/**
 * On service worker startup, restore state
 */
(async () => {
  await initializeStorage();
  const data = await chrome.storage.local.get(['enabled']);
  trackingState.enabled = data.enabled ?? false;
  
  // If tracking is enabled, start monitoring current tab
  if (trackingState.enabled) {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        trackingState.currentTab = activeTab.id;
        trackingState.currentDomain = extractDomain(activeTab.url);
        trackingState.sessionStart = Date.now();
        console.log('Service worker initialized with tracking ON, monitoring:', trackingState.currentDomain);
      }
    } catch (e) {
      console.log('Could not get active tab on startup:', e);
    }
  }
  
  console.log('Service worker initialized, tracking enabled:', trackingState.enabled);
})();
