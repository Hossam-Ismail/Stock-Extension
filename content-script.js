// ==========================================
// STOCKLY - Trading Platform Integration
// Focus: Platforms where users actually TRADE
// ==========================================

// ===== AUTHENTICATION =====
// Listen for auth messages from landing page
window.addEventListener('message', (event) => {
    if (event.data.type === 'STOCKLY_AUTH') {
        console.log('🔐 Received auth token from landing page');

        // Store auth data in Chrome storage
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({
                stocklyToken: event.data.token,
                stocklyUser: {
                    email: event.data.email,
                    name: event.data.name,
                    picture: event.data.picture
                },
                stocklyAuthenticated: true
            }, () => {
                console.log('✅ Auth token saved to Chrome storage');
            });
        }
    }
});

// ===== EXTENSION STATE MANAGEMENT =====
let extensionEnabled = true;

// ===== PLATFORM DETECTION =====
const PLATFORMS = {
  robinhood: {
    name: 'Robinhood',
    type: 'broker',
    detect: () => {
      const hostname = window.location.hostname.includes('robinhood.com');
      const path = window.location.pathname;
      
      // Only activate on pages with specific assets
      // Note: Robinhood uses /indexes/ (plural) not /index/
      return hostname && (
        path.includes('/stocks/') || 
        path.includes('/crypto/') ||
        path.includes('/indexes/') ||  // Fixed: was /index/
        path.includes('/index/')       // Keep both just in case
      );
    },
    selectors: {
      // Multiple selectors to cover all asset types:
      // - web-app-emotion-cache-1y8ops3 (stocks, ETFs)
      // - css-1l9qpx9 (crypto)
      // - css-1y8ops3 (indices)
      title: 'h1.web-app-emotion-cache-1y8ops3, h1.css-1l9qpx9, h1.css-1y8ops3, h1[class*="css-"]',
      insertPoint: 'h1.web-app-emotion-cache-1y8ops3, h1.css-1l9qpx9, h1.css-1y8ops3, h1[class*="css-"]'
    },
    getTicker: () => {
      const title = document.title;
      let ticker = title.split(' - ')[0].split(' | ')[0].trim();
      
      // If ticker is in parentheses like "Bitcoin (BTC)", extract BTC
      const matchParens = ticker.match(/\(([A-Z^.]+)\)/);
      if (matchParens) {
        return matchParens[1];
      }
      
      // For indices where ticker isn't in title, extract from URL
      // URL formats: 
      //   robinhood.com/stocks/AAPL
      //   robinhood.com/crypto/BTC
      //   robinhood.com/indexes/SPX (note: plural!)
      //   robinhood.com/index/SPX (just in case)
      const urlMatch = window.location.pathname.match(/\/(stocks|crypto|indexes?|index)\/([^/]+)/);
      if (urlMatch) {
        const urlTicker = urlMatch[2].toUpperCase();
        
        // If title is like "S&P 500 Index" (no ticker symbol), use URL ticker
        if (ticker.includes('Index') || ticker.includes('ETF') || ticker.length > 10) {
          return urlTicker;
        }
      }
      
      return ticker;
    },
    isCrypto: () => {
      // Detect if we're on a crypto page
      return window.location.pathname.includes('/crypto/');
    }
  },
  
  webull: {
    name: 'Webull',
    type: 'broker',
    detect: () => window.location.hostname.includes('webull.com') && window.location.pathname.includes('/quote/'),
    selectors: {
      title: '.stock-name .ticker',
      insertPoint: '.stock-name'
    },
    getTicker: () => {
      const tickerEl = document.querySelector('.stock-name .ticker');
      return tickerEl?.textContent?.trim()?.toUpperCase();
    }
  },
  
  schwab: {
    name: 'Charles Schwab',
    type: 'broker',
    detect: () => window.location.hostname.includes('schwab.com') && window.location.pathname.includes('/research/'),
    selectors: {
      title: '.symbol-name',
      insertPoint: '.symbol-header'
    },
    getTicker: () => {
      // Schwab format varies, try multiple selectors
      const symbolEl = document.querySelector('.symbol-name, [data-symbol]');
      return symbolEl?.textContent?.trim()?.toUpperCase() || 
             symbolEl?.getAttribute('data-symbol');
    }
  },
  
  tdameritrade: {
    name: 'TD Ameritrade',
    type: 'broker',
    detect: () => window.location.hostname.includes('tdameritrade.com'),
    selectors: {
      title: '.symbol-header h1',
      insertPoint: '.symbol-header'
    },
    getTicker: () => {
      // TD Ameritrade uses various formats
      const match = window.location.href.match(/symbol=([A-Z.]+)/i);
      return match ? match[1] : null;
    }
  },
  
  etrade: {
    name: 'E*TRADE',
    type: 'broker',
    detect: () => window.location.hostname.includes('etrade.com') && window.location.pathname.includes('/stock/'),
    selectors: {
      title: '.stock-symbol',
      insertPoint: '.stock-header'
    },
    getTicker: () => {
      const match = window.location.pathname.match(/\/stock\/([A-Z]+)/);
      return match ? match[1] : null;
    }
  }
};

// Detect current platform
let currentPlatform = null;

function detectAndInitializePlatform() {
  // Reset current platform
  currentPlatform = null;
  
  for (const [key, config] of Object.entries(PLATFORMS)) {
    if (config.detect()) {
      currentPlatform = { key, ...config };
      console.log(`🎯 Stockly detected: ${config.name} (Trading Platform)`);
      
      // Initialize if enabled
      if (extensionEnabled) {
        initializeStockly();
      }
      return true;
    }
  }
  
  console.log('⚠️ Stockly: Not on a supported trading platform');
  return false;
}

// Initial detection
detectAndInitializePlatform();

// Monitor URL changes (for Single Page Apps like Robinhood)
let lastUrl = window.location.href;

setInterval(() => {
  const currentUrl = window.location.href;
  
  if (currentUrl !== lastUrl) {
    console.log('🔄 URL changed:', currentUrl);
    lastUrl = currentUrl;
    
    // Re-detect platform
    const wasDetected = currentPlatform !== null;
    detectAndInitializePlatform();
    
    // If we just moved from non-stock page to stock page
    if (!wasDetected && currentPlatform) {
      console.log('✨ Now on supported page, initializing...');
    }
    
    // If still on supported platform, check if ticker changed
    if (currentPlatform) {
      const newTicker = getStockTicker();
      if (newTicker && newTicker !== lastTicker) {
        console.log("📊 Stock changed to:", newTicker);
        lastTicker = newTicker;
        
        // Remove old button and insert new one
        setTimeout(() => {
          const existingBtn = document.getElementById('analyze-btn-ext');
          if (existingBtn) {
            existingBtn.parentElement?.remove();
          }
          insertAnalyzeButton();
        }, 500);
      }
    }
  }
}, 500); // Check every 500ms

// ===== TICKER DETECTION =====
function getStockTicker() {
  if (!currentPlatform) return null;
  return currentPlatform.getTicker();
}

// Track last ticker to detect stock changes within the same page type
let lastTicker = null;

// ===== WIDGET INJECTION =====
function injectStocklyWidget() {
    if (!extensionEnabled) {
        console.log('Widget injection skipped - extension disabled');
        return;
    }
    
    if (!currentPlatform) {
        console.log('⚠️ Cannot inject widget - no platform detected');
        return;
    }
    
    if (document.getElementById('stockly-widget-ext')) {
        console.log('Widget already exists');
        return;
    }
    
    const widget = document.createElement('div');
    widget.id = 'stockly-widget-ext';
    widget.style.position = 'fixed';
    widget.style.top = '50%';
    widget.style.right = '32px';
    widget.style.left = 'unset';
    widget.style.transform = 'translateY(-50%)';
    widget.style.zIndex = '99999';
    widget.style.width = '420px';
    widget.style.maxHeight = '85vh';
    widget.style.background = 'rgba(20, 20, 30, 0.98)';
    widget.style.borderRadius = '16px';
    widget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)';
    widget.style.color = 'white';
    widget.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
    widget.style.overflow = 'hidden';
    widget.style.animation = 'slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    widget.style.border = '1px solid rgba(46, 185, 224, 0.3)';
    widget.style.backdropFilter = 'blur(20px)';
    
    widget.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:linear-gradient(135deg,#0b4c9a,#1d84c1);border-radius:16px 16px 0 0;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:20px;">📊</span>
                <div>
                    <div style="font-size:16px;font-weight:700;color:#fff;">Stockly Analysis</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.7);">${currentPlatform.name}</div>
                </div>
            </div>
            <button id="stockly-close-btn" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;">✕</button>
        </div>
        <div id="stockly-widget-content" style="padding: 20px; text-align: left; font-size: 14px; line-height: 1.7; color: #e0e0e0; max-height: calc(85vh - 80px); overflow-y: auto;">
            <div style="text-align:center;padding:40px 20px;">
                <div style="font-size:48px;margin-bottom:16px;">💹</div>
                <div style="color:#2eb9e0;font-size:18px;font-weight:600;margin-bottom:8px;">Smart Trading Analysis</div>
                <div style="color:#aaa;font-size:13px;margin-bottom:20px;">Get instant AI insights while you trade</div>
                <div style="text-align:left;max-width:300px;margin:0 auto;font-size:13px;color:#c0c0c0;">
                    <div style="margin-bottom:12px;padding:12px;background:rgba(46,185,224,0.08);border-left:3px solid #2eb9e0;border-radius:6px;">
                        <strong style="color:#2eb9e0;">✨ Before You Trade:</strong><br>
                        • Market context & catalysts<br>
                        • Recent news sentiment<br>
                        • Key risk factors<br>
                        • Research checklist
                    </div>
                    <div style="text-align:center;color:#888;font-size:12px;margin-top:16px;">
                        Click <strong style="color:#667eea;">"Analyze"</strong> next to any stock
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add custom scrollbar styles
    if (!document.getElementById('stockly-scrollbar-style')) {
        const scrollStyle = document.createElement('style');
        scrollStyle.id = 'stockly-scrollbar-style';
        scrollStyle.textContent = `
            #stockly-widget-content::-webkit-scrollbar {
                width: 8px;
            }
            #stockly-widget-content::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 10px;
            }
            #stockly-widget-content::-webkit-scrollbar-thumb {
                background: rgba(46, 185, 224, 0.3);
                border-radius: 10px;
            }
            #stockly-widget-content::-webkit-scrollbar-thumb:hover {
                background: rgba(46, 185, 224, 0.5);
            }
        `;
        document.head.appendChild(scrollStyle);
    }
    
    document.body.appendChild(widget);
    
    // Close button handler
    document.getElementById('stockly-close-btn').onclick = () => {
        widget.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            widget.remove();
            showReopenButton();
        }, 300);
    };
    
    // Add slide out animation
    if (!document.getElementById('stockly-slideout-anim')) {
        const style = document.createElement('style');
        style.id = 'stockly-slideout-anim';
        style.textContent = `
            @keyframes slideOut {
                to {
                    opacity: 0;
                    transform: translateY(-50%) translateX(100px) scale(0.9);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log('✅ Stockly widget injected on', currentPlatform.name);
}

function showReopenButton() {
    if (!extensionEnabled) return;
    if (document.getElementById('stockly-reopen-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'stockly-reopen-btn';
    btn.title = 'Open Stockly';
    btn.style.position = 'fixed';
    btn.style.top = '50%';
    btn.style.right = '32px';
    btn.style.left = 'unset';
    btn.style.transform = 'translateY(-50%)';
    btn.style.zIndex = '99999';
    btn.style.background = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '50%';
    btn.style.width = '56px';
    btn.style.height = '56px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.boxShadow = '0 4px 16px rgba(29,132,193,0.25)';
    btn.style.cursor = 'pointer';
    btn.style.padding = '0';
    btn.style.transition = 'transform 0.2s';
    btn.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:2rem;font-weight:bold;color:#fff;">S</span>`;
    btn.style.background = 'linear-gradient(135deg, #0b4c9a 0%, #1d84c1 50%, #2eb9e0 100%)';
    btn.onmouseover = () => btn.style.transform = 'translateY(-50%) scale(1.1)';
    btn.onmouseout = () => btn.style.transform = 'translateY(-50%) scale(1)';
    btn.onclick = () => {
        btn.remove();
        injectStocklyWidget();
    };
    document.body.appendChild(btn);
}

function removeStocklyWidget() {
  const widget = document.getElementById('stockly-widget-ext');
  const button = document.getElementById('stockly-reopen-btn');
  const analyzeBtn = document.getElementById('analyze-btn-ext');
  
  if (widget) widget.remove();
  if (button) button.remove();
  if (analyzeBtn) {
    const parent = analyzeBtn.parentElement;
    analyzeBtn.remove();
    if (parent && parent.children.length === 0) parent.remove();
  }
  
  console.log('❌ Stockly widgets removed');
}

// ===== ANALYZE BUTTON =====
function insertAnalyzeButton() {
    if (!extensionEnabled) {
        console.log('Analyze button skipped - extension disabled');
        return;
    }
    
    if (!currentPlatform) {
        console.log('No platform detected');
        return;
    }
    
    const titleElem = document.querySelector(currentPlatform.selectors.title);
    
    if (!titleElem) {
        console.log('⏳ Title element not found yet, waiting...');
        return;
    }
    
    if (document.getElementById('analyze-btn-ext')) {
        console.log('Analyze button already exists');
        return;
    }
    
    console.log('📍 Found title element:', titleElem.textContent);
    
    // Create button container
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'inline-flex';
    btnContainer.style.marginLeft = '16px';
    btnContainer.style.verticalAlign = 'middle';
    btnContainer.style.marginTop = '8px';
    
    const analyzeBtn = document.createElement('button');
    analyzeBtn.id = 'analyze-btn-ext';
    analyzeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 6px; vertical-align: middle;">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor"/>
        </svg>
        <span style="font-weight: 600; letter-spacing: 0.3px;">Analyze</span>
    `;
    
    // Modern gradient button styling
    analyzeBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 10px 20px;
        font-size: 14px;
        border-radius: 10px;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        position: relative;
        overflow: hidden;
        font-weight: 500;
    `;

    // Shimmer effect
    const shimmer = document.createElement('div');
    shimmer.style.cssText = `
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transition: left 0.5s;
    `;
    analyzeBtn.appendChild(shimmer);

    // Hover effects
    analyzeBtn.onmouseenter = () => {
        analyzeBtn.style.transform = 'translateY(-2px) scale(1.02)';
        analyzeBtn.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
        shimmer.style.left = '100%';
    };
    
    analyzeBtn.onmouseleave = () => {
        analyzeBtn.style.transform = 'translateY(0) scale(1)';
        analyzeBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        shimmer.style.left = '-100%';
    };
    
    analyzeBtn.onmousedown = () => {
        analyzeBtn.style.transform = 'translateY(0) scale(0.98)';
    };
    
    analyzeBtn.onmouseup = () => {
        analyzeBtn.style.transform = 'translateY(-2px) scale(1.02)';
    };

    btnContainer.appendChild(analyzeBtn);
    
    // Insert based on platform
    const insertPoint = document.querySelector(currentPlatform.selectors.insertPoint);
    if (insertPoint) {
        insertPoint.insertAdjacentElement('afterend', btnContainer);
    }

    // Click handler - SAME AS BEFORE
    analyzeBtn.addEventListener('click', async function() {
        analyzeBtn.style.pointerEvents = 'none';
        analyzeBtn.style.opacity = '0.7';
        
        const ticker = getStockTicker();
        if (!ticker) {
            alert('Could not detect stock ticker');
            analyzeBtn.style.pointerEvents = 'auto';
            analyzeBtn.style.opacity = '1';
            return;
        }
        
        const widget = document.getElementById('stockly-widget-ext');
        
        if (widget) {
            let contentDiv = widget.querySelector('#stockly-widget-content');
            if (!contentDiv) {
                contentDiv = document.createElement('div');
                contentDiv.id = 'stockly-widget-content';
                contentDiv.style.cssText = 'padding: 20px; text-align: left; font-size: 14px; line-height: 1.8; color: #e0e0e0; max-height: calc(85vh - 80px); overflow-y: auto;';
                widget.appendChild(contentDiv);
            }
            
            // Beautiful loading state
            contentDiv.innerHTML = `
                <div style="text-align:center;padding:50px 20px;">
                    <div style="font-size:48px;margin-bottom:16px;animation: bounce 1s infinite;">⚡</div>
                    <div style="color:#2eb9e0;font-size:18px;font-weight:600;margin-bottom:8px;">Analyzing ${ticker}</div>
                    <div style="color:#aaa;font-size:13px;">Gathering market data and insights...</div>
                    <div class="stockly-spinner" style="margin-top:20px;"></div>
                </div>
            `;
        }
        
        try {
            const isCrypto = currentPlatform.isCrypto ? currentPlatform.isCrypto() : false;

            // Get auth token from Chrome storage
            const authData = await new Promise((resolve) => {
                chrome.storage.sync.get(['stocklyToken', 'stocklyAuthenticated'], (result) => {
                    resolve(result);
                });
            });

            // Check if user is authenticated
            if (!authData.stocklyAuthenticated || !authData.stocklyToken) {
                if (widget) {
                    widget.querySelector('#stockly-widget-content').innerHTML = `
                        <div style="text-align:center;padding:40px 20px;">
                            <div style="font-size:48px;margin-bottom:16px;">🔐</div>
                            <div style="color:#667eea;font-size:18px;font-weight:600;margin-bottom:8px;">Sign In Required</div>
                            <div style="color:#aaa;font-size:13px;margin-bottom:20px;">Please sign in to use Stockly analysis</div>
                            <a href="https://stockly-landing.vercel.app" target="_blank" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                Sign In with Google
                            </a>
                        </div>
                    `;
                }
                analyzeBtn.style.pointerEvents = 'auto';
                analyzeBtn.style.opacity = '1';
                return;
            }

            const res = await fetch('https://stockly-backend-production.up.railway.app/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticker,
                    isCrypto,
                    token: authData.stocklyToken
                })
            });
            
            const data = await res.json();
            console.log('Stockly backend response:', data);
            
            if (widget && data.result) {
                const contentDiv = widget.querySelector('#stockly-widget-content');
                contentDiv.innerHTML = data.result;
                contentDiv.scrollTop = 0;
            } else if (widget) {
                widget.querySelector('#stockly-widget-content').innerHTML = `
                    <div style="text-align:center;padding:40px 20px;">
                        <div style="font-size:48px;margin-bottom:16px;">🤔</div>
                        <div style="color:#f39c12;font-size:18px;font-weight:600;margin-bottom:8px;">Hmm, that's odd</div>
                        <div style="color:#aaa;font-size:13px;">We couldn't fetch insights right now. Try again?</div>
                    </div>
                `;
            }
        } catch (e) {
            console.error('Error fetching analysis:', e);
            if (widget) {
                widget.querySelector('#stockly-widget-content').innerHTML = `
                    <div style="text-align:center;padding:40px 20px;">
                        <div style="font-size:48px;margin-bottom:16px;">🔌</div>
                        <div style="color:#e74c3c;font-size:18px;font-weight:600;margin-bottom:8px;">Connection Lost</div>
                        <div style="color:#aaa;font-size:13px;margin-bottom:20px;">Unable to connect to the backend server</div>
                        <button onclick="location.reload()" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                            Refresh Page
                        </button>
                    </div>
                `;
            }
        } finally {
            analyzeBtn.style.pointerEvents = 'auto';
            analyzeBtn.style.opacity = '1';
        }
    });

    // Add animations (SAME AS BEFORE)
    if (!document.getElementById('stockly-animations')) {
        const style = document.createElement('style');
        style.id = 'stockly-animations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50%) translateX(100px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(-50%) translateX(0) scale(1);
                }
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .stockly-spinner {
                display: inline-block;
                width: 30px;
                height: 30px;
                border: 4px solid rgba(46, 185, 224, 0.2);
                border-top: 4px solid #2eb9e0;
                border-radius: 50%;
                animation: stockly-spin 0.8s linear infinite;
            }
            
            @keyframes stockly-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log('✅ Analyze button inserted');
}

// ===== INITIALIZATION =====
function initializeStockly() {
    if (!currentPlatform) {
        console.log('⚠️ Stockly: Not a supported trading platform');
        return;
    }
    
    console.log(`🚀 Initializing Stockly on ${currentPlatform.name}...`);
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['stocklyEnabled'], (result) => {
            extensionEnabled = result.stocklyEnabled !== undefined ? result.stocklyEnabled : true;
            console.log('📊 Extension state:', extensionEnabled ? 'ENABLED' : 'DISABLED');
            startStockly();
        });
    } else {
        console.log('⚠️ Chrome storage not available, using default state');
        extensionEnabled = true;
        startStockly();
    }
}

function startStockly() {
    if (!extensionEnabled) {
        console.log('Extension is disabled, not injecting');
        return;
    }
    
    // Only inject widget if it doesn't exist
    if (!document.getElementById('stockly-widget-ext') && !document.getElementById('stockly-reopen-btn')) {
        injectStocklyWidget();
    }
    
    // Try to insert button
    insertAnalyzeButton();
    
    // Set up retry mechanism (only if button doesn't exist yet)
    if (!document.getElementById('analyze-btn-ext')) {
        let retryCount = 0;
        const maxRetries = 10;
        const retryInterval = setInterval(() => {
            if (document.getElementById('analyze-btn-ext') || retryCount >= maxRetries) {
                clearInterval(retryInterval);
                if (retryCount >= maxRetries) {
                    console.log(`⚠️ Could not find title element on ${currentPlatform.name} after ${maxRetries} attempts`);
                }
                return;
            }
            console.log(`🔄 Retry ${retryCount + 1} - Looking for title element...`);
            insertAnalyzeButton();
            retryCount++;
        }, 500);
    }
}

// Listen for enable/disable messages from popup
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📨 Message received:', request);
        
        if (request.action === 'enable') {
            extensionEnabled = true;
            injectStocklyWidget();
            insertAnalyzeButton();
            sendResponse({ status: 'enabled' });
        } 
        else if (request.action === 'disable') {
            extensionEnabled = false;
            removeStocklyWidget();
            sendResponse({ status: 'disabled' });
        }
        
        return true;
    });
}

const observer = new MutationObserver(() => {
    if (extensionEnabled && !document.getElementById('analyze-btn-ext')) {
        insertAnalyzeButton();
    }
});

if (currentPlatform) {
    observer.observe(document.body, { childList: true, subtree: true });
}
