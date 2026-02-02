/**
 * EchoTrace Popup Logic
 * Quick view of today's stats and quick toggle
 */

/**
 * Format seconds to readable time
 */
function formatTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayKey() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get date N days ago
 */
function getDateNDaysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}

/**
 * Get total time for today
 */
function getTodayTotal(stats) {
  const today = getTodayKey();
  const todayData = stats.dailyStats[today] || {};
  return Object.values(todayData).reduce((sum, val) => sum + val, 0);
}

/**
 * Get total for last 7 days
 */
function getWeekTotal(stats) {
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const dateKey = getDateNDaysAgo(i);
    const dayData = stats.dailyStats[dateKey] || {};
    total += Object.values(dayData).reduce((sum, val) => sum + val, 0);
  }
  return total;
}

/**
 * Get quick echo message
 */
function getQuickEcho(stats) {
  const weekTotal = getWeekTotal(stats);
  if (weekTotal === 0) {
    return 'Start tracking to see your habits';
  }
  
  const dailyAverage = Math.round(weekTotal / 7 / 3600 * 10) / 10;
  const categoryBreakdown = stats.totalByCategory;
  const socialDaily = ((categoryBreakdown.social || 0) / 7 / 3600 * 10) / 10;
  
  if (socialDaily > 2) {
    return `⚠️ High social media usage (${socialDaily}h/day). Try setting daily limits!`;
  } else if (dailyAverage < 3) {
    return `✨ Great balance! Keep maintaining ${dailyAverage}h/day.`;
  } else if (dailyAverage < 6) {
    return `👍 Moderate usage: ${dailyAverage}h/day. Consider a 25-min focus block next.`;
  } else {
    return `📱 ${dailyAverage}h/day average. Time to reset habits? 💪`;
  }
}

/**
 * Load and display stats
 */
async function loadStats() {
  chrome.runtime.sendMessage(
    { action: 'getStats' },
    (stats) => {
      // Check for Chrome runtime errors
      if (chrome.runtime.lastError) {
        console.error('Chrome runtime error:', chrome.runtime.lastError.message);
        document.getElementById('todayTime').textContent = 'Error';
        document.getElementById('echoMessage').innerHTML = 
          '<p>⚠️ Unable to connect to background worker. Try reloading the extension.</p>';
        return;
      }
      
      if (!stats) {
        console.error('Failed to load stats - no response from background');
        document.getElementById('todayTime').textContent = 'Error';
        document.getElementById('echoMessage').innerHTML = 
          '<p>⚠️ No data available. Try reloading the extension.</p>';
        return;
      }
      
      // Update today's time
      const todayTime = getTodayTotal(stats);
      document.getElementById('todayTime').textContent = formatTime(todayTime);
      
      // Update top category
      const topCat = Object.entries(stats.totalByCategory || {})
        .sort(([, a], [, b]) => b - a)[0];
      document.getElementById('topCategory').textContent = topCat ? topCat[0] : '—';
      
      // Update top site
      const topSite = Object.entries(stats.totalByDomain || {})
        .sort(([, a], [, b]) => b - a)[0];
      document.getElementById('topSite').textContent = topSite ? topSite[0] : '—';
      
      // Update echo message
      document.getElementById('echoMessage').innerHTML = 
        `<p>${getQuickEcho(stats)}</p>`;
      
      // Update tracking toggle - use strict boolean check
      const isEnabled = stats.enabled === true;
      document.getElementById('trackingToggle').checked = isEnabled;
      console.log('Loaded tracking state:', isEnabled);
    }
  );
}

/**
 * Handle tracking toggle
 */
document.getElementById('trackingToggle').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.runtime.sendMessage(
    { action: 'toggleTracking', enabled },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error toggling tracking:', chrome.runtime.lastError.message);
        alert('Failed to toggle tracking. Try reloading the extension.');
        e.target.checked = !enabled; // Revert toggle
        return;
      }
      
      if (response && response.success) {
        console.log('Tracking changed to:', enabled);
        loadStats();
      } else {
        console.error('Failed to toggle tracking');
        e.target.checked = !enabled; // Revert toggle
      }
    }
  );
});

/**
 * Handle dashboard button
 */
document.getElementById('dashboardBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'newtab.html' });
});

/**
 * Handle reset button
 */
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Reset all data? This cannot be undone.')) {
    chrome.runtime.sendMessage(
      { action: 'resetData' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error resetting data:', chrome.runtime.lastError.message);
          alert('Failed to reset data. Try reloading the extension.');
          return;
        }
        
        if (response && response.success) {
          loadStats();
        } else {
          console.error('Failed to reset data');
          alert('Failed to reset data.');
        }
      }
    );
  }
});

/**
 * Load stats on popup open
 */
document.addEventListener('DOMContentLoaded', loadStats);
