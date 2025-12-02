// Stockly Background Service Worker
// Handles price alerts and periodic checks

const BACKEND_URL = 'https://stockly-backend-production.up.railway.app';
const CHECK_INTERVAL = 5; // Check prices every 5 minutes

// Set up alarm for periodic price checks
chrome.runtime.onInstalled.addListener(() => {
  console.log('Stockly background service installed');

  // Create alarm for price checks
  chrome.alarms.create('priceCheck', {
    periodInMinutes: CHECK_INTERVAL
  });
});

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'priceCheck') {
    checkPriceAlerts();
  }
});

// Check all active price alerts
async function checkPriceAlerts() {
  try {
    // Get all price alerts from storage
    const result = await chrome.storage.local.get(['priceAlerts']);
    const alerts = result.priceAlerts || {};

    if (Object.keys(alerts).length === 0) {
      return; // No alerts to check
    }

    // Check each alert
    for (const [ticker, alertData] of Object.entries(alerts)) {
      if (!alertData.enabled) continue;

      // Fetch current price (using a simple method without authentication)
      try {
        const price = await fetchStockPrice(ticker);

        if (price) {
          // Check if alert conditions are met
          const triggeredAlerts = [];

          if (alertData.abovePrice && price >= alertData.abovePrice) {
            triggeredAlerts.push({
              type: 'above',
              targetPrice: alertData.abovePrice,
              currentPrice: price
            });
          }

          if (alertData.belowPrice && price <= alertData.belowPrice) {
            triggeredAlerts.push({
              type: 'below',
              targetPrice: alertData.belowPrice,
              currentPrice: price
            });
          }

          // Send notifications for triggered alerts
          for (const trigger of triggeredAlerts) {
            await sendPriceNotification(ticker, trigger);

            // Disable the alert after triggering (one-time alert)
            alerts[ticker].enabled = false;
            await chrome.storage.local.set({ priceAlerts: alerts });
          }
        }
      } catch (err) {
        console.error(`Error checking price for ${ticker}:`, err);
      }
    }
  } catch (err) {
    console.error('Error in checkPriceAlerts:', err);
  }
}

// Fetch stock price using Yahoo Finance (via backend proxy to avoid CORS)
async function fetchStockPrice(ticker) {
  try {
    // Use a free public API (no auth needed)
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`);
    const data = await response.json();

    if (data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
      return data.chart.result[0].meta.regularMarketPrice;
    }

    return null;
  } catch (err) {
    console.error(`Error fetching price for ${ticker}:`, err);
    return null;
  }
}

// Send notification when price alert is triggered
async function sendPriceNotification(ticker, trigger) {
  const title = `${ticker} Price Alert!`;
  const message = trigger.type === 'above'
    ? `${ticker} is now $${trigger.currentPrice.toFixed(2)} (above your alert price of $${trigger.targetPrice.toFixed(2)})`
    : `${ticker} is now $${trigger.currentPrice.toFixed(2)} (below your alert price of $${trigger.targetPrice.toFixed(2)})`;

  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'Stockly_Logo.png',
    title: title,
    message: message,
    priority: 2
  });
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setPriceAlert') {
    setPriceAlert(request.ticker, request.alertData)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }

  if (request.action === 'getPriceAlerts') {
    getPriceAlerts()
      .then(alerts => sendResponse({ success: true, alerts }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === 'removePriceAlert') {
    removePriceAlert(request.ticker)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// Set a price alert
async function setPriceAlert(ticker, alertData) {
  const result = await chrome.storage.local.get(['priceAlerts']);
  const alerts = result.priceAlerts || {};

  alerts[ticker] = {
    ...alertData,
    enabled: true,
    createdAt: Date.now()
  };

  await chrome.storage.local.set({ priceAlerts: alerts });

  // Send confirmation notification
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'Stockly_Logo.png',
    title: 'Price Alert Set',
    message: `You'll be notified when ${ticker} reaches your target price`,
    priority: 1
  });
}

// Get all price alerts
async function getPriceAlerts() {
  const result = await chrome.storage.local.get(['priceAlerts']);
  return result.priceAlerts || {};
}

// Remove a price alert
async function removePriceAlert(ticker) {
  const result = await chrome.storage.local.get(['priceAlerts']);
  const alerts = result.priceAlerts || {};

  delete alerts[ticker];

  await chrome.storage.local.set({ priceAlerts: alerts });
}
