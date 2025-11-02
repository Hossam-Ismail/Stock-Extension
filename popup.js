// Get DOM elements
const button = document.getElementById('OnOff');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const settingsLink = document.getElementById('settings-link');
const helpLink = document.getElementById('help-link');

// Initialize state from storage
let isEnabled = true;

// Load saved state on popup open
chrome.storage.sync.get(['stocklyEnabled'], (result) => {
  isEnabled = result.stocklyEnabled !== undefined ? result.stocklyEnabled : true;
  updateUI();
});

// Toggle button click handler
button.addEventListener('click', () => {
  isEnabled = !isEnabled;
  
  // Save state to storage
  chrome.storage.sync.set({ stocklyEnabled: isEnabled }, () => {
    console.log('Stockly state saved:', isEnabled);
  });
  
  // Update UI
  updateUI();
  
  // Send message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.url && activeTab.url.includes('robinhood.com')) {
      chrome.tabs.sendMessage(activeTab.id, { 
        action: isEnabled ? 'enable' : 'disable' 
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Content script not ready yet');
        } else {
          console.log('Message sent to content script:', response);
        }
      });
    }
  });
});

// Update UI based on state
function updateUI() {
  if (isEnabled) {
    // Enabled state
    button.classList.add('on');
    button.querySelector('span').textContent = 'Enabled';
    statusDot.classList.remove('inactive');
    statusText.textContent = 'Extension Active';
    statusDot.style.background = '#4CAF50';
  } else {
    // Disabled state
    button.classList.remove('on');
    button.querySelector('span').textContent = 'Disabled';
    statusDot.classList.add('inactive');
    statusText.textContent = 'Extension Disabled';
    statusDot.style.background = '#e74c3c';
  }
}

// Settings link handler
settingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  // Open settings page or show settings modal
  alert('Settings coming soon! 🚀\n\nPlanned features:\n• API key management\n• Custom themes\n• Notification preferences');
});

// Help link handler
helpLink.addEventListener('click', (e) => {
  e.preventDefault();
  // Open help/documentation
  const helpMessage = `
📚 Stockly Help

How to use:
1. Navigate to any stock on Robinhood
2. Click the "Analyze" button next to the stock name
3. View AI-powered insights in the Stockly widget

Features:
• Real-time stock analysis
• Beginner-friendly explanations
• Current market sentiment
• Actionable investment tips

Need more help?
Visit: github.com/yourusername/stockly
  `;
  alert(helpMessage);
});

// Check if we're on Robinhood and show appropriate message
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const activeTab = tabs[0];
  if (activeTab && activeTab.url && !activeTab.url.includes('robinhood.com')) {
    statusText.textContent = 'Not on Robinhood';
    statusDot.style.background = '#f39c12';
  }
});
