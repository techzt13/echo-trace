/**
 * EchoTrace Dashboard Logic
 * Renders charts, stats, and future echo projections
 */

let categoryChart = null;
let weeklyChart = null;
let currentStats = {
  dailyStats: {},
  totalByDomain: {},
  totalByCategory: {},
  enabled: false,
};

/**
 * Load stats from storage and update dashboard
 */
async function loadAndRenderStats() {
  // Request stats from background service worker
  chrome.runtime.sendMessage(
    { action: 'getStats' },
    (response) => {
      if (response) {
        currentStats = response;
        renderDashboard();
      }
    }
  );
}

/**
 * Convert seconds to human-readable time
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
 * Calculate total time for today
 */
function getTodayTotal() {
  const today = getTodayKey();
  const todayData = currentStats.dailyStats[today] || {};
  return Object.values(todayData).reduce((sum, val) => sum + val, 0);
}

/**
 * Calculate total time for this week
 */
function getWeekTotal() {
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const dateKey = getDateNDaysAgo(i);
    const dayData = currentStats.dailyStats[dateKey] || {};
    total += Object.values(dayData).reduce((sum, val) => sum + val, 0);
  }
  return total;
}

/**
 * Get top category
 */
function getTopCategory() {
  if (Object.keys(currentStats.totalByCategory).length === 0) return 'N/A';
  return Object.entries(currentStats.totalByCategory)
    .sort(([, a], [, b]) => b - a)[0][0];
}

/**
 * Get top domain
 */
function getTopDomain() {
  if (Object.keys(currentStats.totalByDomain).length === 0) return 'N/A';
  return Object.entries(currentStats.totalByDomain)
    .sort(([, a], [, b]) => b - a)[0][0];
}

/**
 * Render overview stats
 */
function renderStats() {
  const todayTotal = getTodayTotal();
  const weekTotal = getWeekTotal();
  
  document.getElementById('todayTotal').textContent = formatTime(todayTotal);
  document.getElementById('weekTotal').textContent = formatTime(weekTotal);
  document.getElementById('topCategory').textContent = getTopCategory();
  document.getElementById('topDomain').textContent = getTopDomain();
}

/**
 * Render top sites list
 */
function renderTopSites() {
  const container = document.getElementById('topSitesContainer');
  
  const sortedDomains = Object.entries(currentStats.totalByDomain)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  if (sortedDomains.length === 0) {
    container.innerHTML = '<p class="empty-state">No data yet. Enable tracking to get started!</p>';
    return;
  }
  
  container.innerHTML = sortedDomains
    .map(([domain, seconds]) => `
      <div class="site-item">
        <span class="site-name">${domain}</span>
        <span class="site-time">${formatTime(seconds)}</span>
      </div>
    `)
    .join('');
}

/**
 * Calculate daily breakdown for week
 */
function getWeeklyData() {
  const labels = [];
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const dateKey = getDateNDaysAgo(i);
    const dayData = currentStats.dailyStats[dateKey] || {};
    const total = Object.values(dayData).reduce((sum, val) => sum + val, 0);
    
    const date = new Date(dateKey);
    labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    data.push(Math.round(total / 3600)); // Convert to hours
  }
  
  return { labels, data };
}

/**
 * Render category chart (pie/donut)
 */
function renderCategoryChart() {
  const today = getTodayKey();
  const todayData = currentStats.dailyStats[today] || {};
  
  const labels = Object.keys(todayData);
  const data = Object.values(todayData).map(seconds => Math.round(seconds / 60)); // Convert to minutes
  
  const ctx = document.getElementById('categoryChart').getContext('2d');
  
  if (categoryChart) {
    categoryChart.destroy();
  }
  
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#FF6B6B', // Red
          '#4ECDC4', // Teal
          '#45B7D1', // Blue
          '#FFA07A', // Light Salmon
          '#98D8C8', // Mint
        ],
        borderColor: '#fff',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 13 },
            padding: 15,
          },
        },
      },
    },
  });
}

/**
 * Render weekly bar chart
 */
function renderWeeklyChart() {
  const { labels, data } = getWeeklyData();
  
  const ctx = document.getElementById('weeklyChart').getContext('2d');
  
  if (weeklyChart) {
    weeklyChart.destroy();
  }
  
  weeklyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Hours',
        data: data,
        backgroundColor: '#45B7D1',
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours',
          },
        },
      },
    },
  });
}

/**
 * Calculate future echo projection
 */
function calculateFutureEcho() {
  const weekTotal = getWeekTotal();
  const dailyAverage = Math.round(weekTotal / 7);
  const dailyAverageHours = dailyAverage / 3600;
  
  const categoryBreakdown = currentStats.totalByCategory;
  
  let projections = [];
  
  // Social media projection
  const socialHourly = (categoryBreakdown.social || 0) / 3600;
  const socialDaily = socialHourly / 7;
  if (socialDaily > 1) {
    const lostFocusHours = Math.round((socialDaily - 1) * 90 * 1.5); // Multiplier for context switching
    projections.push({
      category: 'Social Media',
      icon: '📱',
      hours: socialDaily,
      projection: `In 90 days, at current pace, you could lose ~${lostFocusHours} focus hours (${Math.round(lostFocusHours / 8)} workdays lost to distractions).`,
      sentiment: 'warning',
    });
  }
  
  // Entertainment projection
  const entertainmentHourly = (categoryBreakdown.entertainment || 0) / 3600;
  const entertainmentDaily = entertainmentHourly / 7;
  if (entertainmentDaily > 2) {
    const projectedHours = Math.round(entertainmentDaily * 90);
    projections.push({
      category: 'Entertainment',
      icon: '🎬',
      hours: entertainmentDaily,
      projection: `${projectedHours} hours of entertainment in 90 days. That's ${Math.round(projectedHours / 24)} full days!`,
      sentiment: 'neutral',
    });
  }
  
  // Productivity projection
  const productivityHourly = (categoryBreakdown.productivity || 0) / 3600;
  const productivityDaily = productivityHourly / 7;
  if (productivityDaily > 2) {
    projections.push({
      category: 'Productivity',
      icon: '⚡',
      hours: productivityDaily,
      projection: `${Math.round(productivityDaily * 90)} productive hours projected. Keep it up! 🚀`,
      sentiment: 'positive',
    });
  }
  
  // Overall projection
  const projectedDaysSaved = Math.round((24 - dailyAverageHours) * 90 / 24);
  projections.push({
    category: 'Overall Balance',
    icon: '⚖️',
    hours: dailyAverageHours,
    projection: dailyAverageHours < 4 
      ? `Time well spent! At ${dailyAverageHours.toFixed(1)}h/day, you'll have ${Math.round((24 - dailyAverageHours) * 90)} hours for meaningful activities in 90 days. 🌟`
      : dailyAverageHours < 8
        ? `Balanced habits: ${dailyAverageHours.toFixed(1)}h/day screen time. You have ${Math.round((24 - dailyAverageHours) * 90)} hours for other pursuits. 🎯`
        : `High screen time: ${dailyAverageHours.toFixed(1)}h/day. Consider setting daily goals to reclaim ${Math.round((dailyAverageHours - 4) * 90)} hours in 90 days. 💪`,
    sentiment: dailyAverageHours < 4 ? 'positive' : dailyAverageHours < 8 ? 'neutral' : 'warning',
  });
  
  return projections;
}

/**
 * Render future echo section
 */
function renderFutureEcho() {
  const content = document.getElementById('echoContent');
  
  if (!currentStats.enabled || Object.keys(currentStats.dailyStats).length === 0) {
    content.innerHTML = '<p class="empty-state">Enable tracking to see future projections</p>';
    return;
  }
  
  const projections = calculateFutureEcho();
  
  content.innerHTML = projections
    .map(proj => `
      <div class="echo-item echo-${proj.sentiment}">
        <div class="echo-header-mini">
          <span class="echo-icon">${proj.icon}</span>
          <span class="echo-category">${proj.category}</span>
          <span class="echo-hours">${proj.hours.toFixed(1)}h/day avg</span>
        </div>
        <p class="echo-projection">${proj.projection}</p>
      </div>
    `)
    .join('');
}

/**
 * Update tracking toggle
 */
function updateTrackingToggle() {
  const toggle = document.getElementById('trackingToggle');
  toggle.checked = currentStats.enabled;
}

/**
 * Handle tracking toggle
 */
document.getElementById('trackingToggle').addEventListener('change', async (e) => {
  const enabled = e.target.checked;
  chrome.runtime.sendMessage(
    { action: 'toggleTracking', enabled },
    (response) => {
      if (response.success) {
        currentStats.enabled = response.enabled;
        console.log('Tracking toggled:', enabled);
      }
    }
  );
});

/**
 * Handle reset button
 */
document.getElementById('resetBtn').addEventListener('click', async () => {
  if (confirm('Are you sure? This will delete all tracked data.')) {
    chrome.runtime.sendMessage(
      { action: 'resetData' },
      (response) => {
        if (response.success) {
          currentStats = {
            dailyStats: {},
            totalByDomain: {},
            totalByCategory: {},
            enabled: currentStats.enabled,
          };
          renderDashboard();
        }
      }
    );
  }
});

/**
 * Handle export button
 */
document.getElementById('exportBtn').addEventListener('click', async () => {
  const dataStr = JSON.stringify(currentStats, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `echotrace-export-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

/**
 * Main render function
 */
function renderDashboard() {
  renderStats();
  renderTopSites();
  renderCategoryChart();
  renderWeeklyChart();
  renderFutureEcho();
  updateTrackingToggle();
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  loadAndRenderStats();
  
  // Refresh stats every 5 seconds
  setInterval(loadAndRenderStats, 5000);
});
