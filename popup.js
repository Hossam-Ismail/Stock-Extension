// Get DOM elements
const button = document.getElementById('OnOff');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const settingsLink = document.getElementById('settings-link');
const helpLink = document.getElementById('help-link');
const signInBtn = document.getElementById('sign-in-btn');
const signInContainer = document.getElementById('sign-in-container');
const userProfile = document.getElementById('user-profile');
const logoutBtn = document.getElementById('logout-btn');

// Initialize state from storage
let isEnabled = true;
let isAuthenticated = false;

// Check authentication and terms
chrome.storage.sync.get(['hasAcceptedTerms', 'stocklyEnabled', 'stocklyAuthenticated', 'stocklyUser'], (result) => {
  isAuthenticated = result.stocklyAuthenticated || false;

  // Update UI based on auth state
  if (isAuthenticated && result.stocklyUser) {
    // Show user profile
    userProfile.style.display = 'block';
    signInContainer.style.display = 'none';
    document.getElementById('user-name').textContent = result.stocklyUser.name;
    document.getElementById('user-email').textContent = result.stocklyUser.email;
    document.getElementById('user-picture').src = result.stocklyUser.picture;
  } else {
    // Show sign in button
    userProfile.style.display = 'none';
    signInContainer.style.display = 'block';
  }

  if (!result.hasAcceptedTerms) {
    showTermsModal();
  } else {
    isEnabled = result.stocklyEnabled !== undefined ? result.stocklyEnabled : true;
    updateUI();
  }
});

// Sign in button handler
signInBtn.addEventListener('click', () => {
  // Open landing page in new tab
  chrome.tabs.create({ url: 'https://stockly-landing.vercel.app' });
});

// Logout button handler
logoutBtn.addEventListener('click', () => {
  chrome.storage.sync.remove(['stocklyToken', 'stocklyUser', 'stocklyAuthenticated'], () => {
    console.log('🔓 User logged out');
    // Refresh UI
    userProfile.style.display = 'none';
    signInContainer.style.display = 'block';
    isAuthenticated = false;
  });
});

// Listen for storage changes (auth from landing page)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.stocklyAuthenticated) {
    if (changes.stocklyAuthenticated.newValue === true) {
      // User just logged in, refresh to show profile
      chrome.storage.sync.get(['stocklyUser'], (result) => {
        if (result.stocklyUser) {
          console.log('✅ Auth detected, updating popup UI');
          userProfile.style.display = 'block';
          signInContainer.style.display = 'none';
          document.getElementById('user-name').textContent = result.stocklyUser.name;
          document.getElementById('user-email').textContent = result.stocklyUser.email;
          document.getElementById('user-picture').src = result.stocklyUser.picture;
          isAuthenticated = true;
        }
      });
    }
  }
});

// Show terms acceptance modal
function showTermsModal() {
  const modal = document.createElement('div');
  modal.id = 'terms-modal';
  modal.innerHTML = `
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;">
      <div style="background:#2a2a2a;border-radius:12px;padding:24px;max-width:400px;border:1px solid rgba(46,185,224,0.3);box-shadow:0 8px 32px rgba(0,0,0,0.5);">
        <h2 style="color:#2eb9e0;margin:0 0 16px 0;font-size:20px;text-align:center;">📚 Stockly Terms of Use</h2>
        
        <div style="max-height:300px;overflow-y:auto;padding:12px;background:rgba(0,0,0,0.3);border-radius:8px;margin-bottom:16px;font-size:13px;line-height:1.6;color:#d0d0d0;">
          <p><strong style="color:#fbbf24;">What Stockly Does:</strong></p>
          <p>Stockly is a research tool that aggregates public market data and generates general information about stocks using AI and data analysis.</p>
          
          <p style="margin-top:12px;"><strong style="color:#fbbf24;">⚠️ Important Disclaimers:</strong></p>
          <ul style="margin:8px 0;padding-left:20px;">
            <li>NOT personalized investment advice</li>
            <li>NOT tailored to your financial situation</li>
            <li>NOT a substitute for professional financial advice</li>
            <li>For general informational and educational purposes only</li>
            <li>All investments carry risk of loss</li>
            <li>Past performance does not guarantee future results</li>
          </ul>
          
          <p style="margin-top:12px;"><strong style="color:#fbbf24;">By Using Stockly, You Acknowledge:</strong></p>
          <ul style="margin:8px 0;padding-left:20px;">
            <li>You will conduct your own research</li>
            <li>You understand the risks of investing</li>
            <li>You may lose money in the stock market</li>
            <li>You should consult a licensed financial advisor</li>
            <li>Stockly is not responsible for investment decisions</li>
          </ul>
          
          <p style="margin-top:12px;font-size:11px;color:#888;">This tool provides general market information. It does not know your financial situation, goals, or risk tolerance. Always do your own due diligence.</p>
        </div>
        
        <div style="display:flex;gap:12px;">
          <button id="accept-terms" style="flex:1;padding:12px;background:linear-gradient(135deg,#1d84c1,#2eb9e0);color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">
            I Understand & Agree
          </button>
          <button id="decline-terms" style="flex:1;padding:12px;background:#3a3a3a;color:#fff;border:1px solid #4a4a4a;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">
            Decline
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Accept button
  document.getElementById('accept-terms').addEventListener('click', () => {
    chrome.storage.sync.set({ hasAcceptedTerms: true }, () => {
      modal.remove();
      chrome.storage.sync.get(['stocklyEnabled'], (result) => {
        isEnabled = result.stocklyEnabled !== undefined ? result.stocklyEnabled : true;
        updateUI();
      });
    });
  });
  
  // Decline button
  document.getElementById('decline-terms').addEventListener('click', () => {
    alert('You must accept the terms to use Stockly. The extension will remain disabled.');
    modal.remove();
    isEnabled = false;
    chrome.storage.sync.set({ stocklyEnabled: false });
    updateUI();
  });
}

// Toggle button click handler
button.addEventListener('click', () => {
  chrome.storage.sync.get(['hasAcceptedTerms'], (result) => {
    if (!result.hasAcceptedTerms) {
      showTermsModal();
      return;
    }
    
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
  const settingsInfo = `⚙️ Settings

Current Features:
✓ Toggle extension on/off
✓ Market interest scoring
✓ AI-powered analysis
✓ News aggregation

Coming Soon:
• Custom alert thresholds
• Watchlist integration
• Theme customization
• Export analysis data

Need to reset terms?
Clear extension data in Chrome settings.`;
  
  alert(settingsInfo);
});

// Help link handler
helpLink.addEventListener('click', (e) => {
  e.preventDefault();
  const helpMessage = `📚 Stockly Help

How to Use:
1. Navigate to any stock on Robinhood.com
2. Look for the "Analyze with Stockly" button
3. Click it to see market data and analysis
4. Review the Market Interest Score and AI insights

What You'll See:
• Current price and change data
• Market Interest Score (0-100)
• Recent news headlines
• General market context and considerations

Remember:
⚠️ This is general information only
⚠️ Not personalized investment advice
⚠️ Always do your own research
⚠️ Consult a licensed financial advisor

Questions or Issues?
Visit: github.com/yourusername/stockly/issues`;
  
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
