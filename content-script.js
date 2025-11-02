// ===== EXTENSION STATE MANAGEMENT =====
// Track if extension is enabled
let extensionEnabled = true;

// ===== TICKER DETECTION =====
// Function to extract stock ticker from page title
function getStockTicker() {
   const title = document.title;
   const ticker = title.split(' - ')[0];
   return ticker;
}

// Track last title to detect changes
let lastTitle = document.title;

// Function that checks for title changes every second
setInterval(() => {
   if (document.title !== lastTitle) {
       lastTitle = document.title;
       const newTicker = getStockTicker();
       console.log("Stock changed to:", newTicker);
   }
}, 1000);

// ===== WIDGET INJECTION =====
// Inject floating Stockly UI on Robinhood
function injectStocklyWidget() {
    if (!extensionEnabled) {
        console.log('Widget injection skipped - extension disabled');
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
    widget.style.width = '320px';
    widget.style.background = '#2a2a2a';
    widget.style.borderRadius = '12px';
    widget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
    widget.style.color = 'white';
    widget.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
    widget.style.overflow = 'hidden';
    widget.style.animation = 'slideIn 0.3s ease-out';
    widget.style.border = 'none';
    widget.innerHTML = `
        <div style="background: linear-gradient(135deg, #0b4c9a 0%, #1d84c1 50%, #2eb9e0 100%); padding: 24px 24px 16px 24px; border-radius: 12px 12px 0 0; font-size: 22px; font-weight: 700; letter-spacing: 0.3px; position: relative; text-align: center;">
            Stockly
        </div>
        <div id="stockly-widget-content" style="padding: 20px; text-align: left; font-size: 14px; line-height: 1.7; color: #e0e0e0; max-height: 500px; overflow-y: auto;">
            Welcome to Stockly! Your AI companion for stress-free investing.<br><br>
            <b style="color:#1d84c1;">Project Features:</b><br>
            <div style="margin-left:12px;margin-top:4px;">• Friendly stock insights</div>
            <div style="margin-left:12px;margin-top:4px;">• Beginner tips</div>
            <div style="margin-left:12px;margin-top:4px;">• Real-time updates</div>
            <div style="margin-left:12px;margin-top:4px;">• Personalized suggestions</div>
            <br>
            <i style="color:#aaa;">Click "Analyze" on any stock to get started!</i>
        </div>
        <button id="stockly-close-btn" style="position:absolute;top:12px;right:16px;background:transparent;border:none;color:white;font-size:24px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">&times;</button>
    `;
    document.body.appendChild(widget);
    document.getElementById('stockly-close-btn').onclick = () => {
        widget.remove();
        showReopenButton();
    };
    
    console.log('✅ Stockly widget injected');
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

// Function to remove all Stockly elements
function removeStocklyWidget() {
  const widget = document.getElementById('stockly-widget-ext');
  const button = document.getElementById('stockly-reopen-btn');
  const analyzeBtn = document.getElementById('analyze-btn-ext');
  const btnContainer = document.querySelector('div[style*="inline-flex"]');
  
  if (widget) widget.remove();
  if (button) button.remove();
  if (analyzeBtn) analyzeBtn.remove();
  if (btnContainer && btnContainer.contains(analyzeBtn)) btnContainer.remove();
  
  console.log('❌ Stockly widgets removed');
}

// ===== ANALYZE BUTTON =====
function insertAnalyzeButton() {
    if (!extensionEnabled) {
        console.log('Analyze button skipped - extension disabled');
        return;
    }
    
    const titleElem = document.querySelector('h1.web-app-emotion-cache-1y8ops3');
    
    if (!titleElem) {
        console.log('⏳ Title element not found yet, waiting...');
        return;
    }
    
    if (document.getElementById('analyze-btn-ext')) {
        console.log('Analyze button already exists');
        return;
    }
    
    console.log('📍 Found title element:', titleElem.textContent);
    
    // Create button container for better positioning
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'inline-flex';
    btnContainer.style.marginLeft = '16px';
    btnContainer.style.verticalAlign = 'middle';
    
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

    // Shimmer effect overlay
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
    titleElem.insertAdjacentElement('afterend', btnContainer);

    // Click handler for analyze button
    analyzeBtn.addEventListener('click', async function() {
        // Disable button during loading
        analyzeBtn.style.pointerEvents = 'none';
        analyzeBtn.style.opacity = '0.7';
        
        const ticker = getStockTicker();
        const widget = document.getElementById('stockly-widget-ext');
        
        if (widget) {
            let contentDiv = widget.querySelector('#stockly-widget-content');
            if (!contentDiv) {
                contentDiv = document.createElement('div');
                contentDiv.id = 'stockly-widget-content';
                contentDiv.style.cssText = 'padding: 20px; text-align: left; font-size: 14px; line-height: 1.8; color: #e0e0e0; max-height: 500px; overflow-y: auto;';
                widget.appendChild(contentDiv);
            }
            
            // Beautiful loading state
            contentDiv.innerHTML = `
                <div style="text-align:center;padding:50px 20px;">
                    <div style="font-size:48px;margin-bottom:16px;animation: bounce 1s infinite;">⚡</div>
                    <div style="color:#2eb9e0;font-size:18px;font-weight:600;margin-bottom:8px;">Analyzing ${ticker}</div>
                    <div style="color:#aaa;font-size:13px;">Getting the latest insights...</div>
                    <div class="stockly-spinner" style="margin-top:20px;"></div>
                </div>
            `;
        }
        
        try {
            const res = await fetch('http://localhost:3001/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker })
            });
            
            const data = await res.json();
            console.log('Stockly backend response:', data);
            
            if (widget && data.result) {
                const contentDiv = widget.querySelector('#stockly-widget-content');
                contentDiv.innerHTML = data.result;
                
                // Smooth scroll to top of widget
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
                        <div style="color:#aaa;font-size:13px;margin-bottom:20px;">Make sure the backend is running on port 3001</div>
                        <button onclick="location.reload()" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                            Refresh Page
                        </button>
                    </div>
                `;
            }
        } finally {
            // Re-enable button
            analyzeBtn.style.pointerEvents = 'auto';
            analyzeBtn.style.opacity = '1';
        }
    });

    // Add animations
    if (!document.getElementById('stockly-animations')) {
        const style = document.createElement('style');
        style.id = 'stockly-animations';
        style.textContent = `
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
    
    console.log('✅ Analyze button inserted next to:', titleElem.textContent);
}

// ===== INITIALIZATION =====
// Wait for page to be fully loaded
function initializeStockly() {
    console.log('🚀 Initializing Stockly...');
    
    // Check if chrome.storage is available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        // Load state from storage
        chrome.storage.sync.get(['stocklyEnabled'], (result) => {
            extensionEnabled = result.stocklyEnabled !== undefined ? result.stocklyEnabled : true;
            console.log('📊 Extension state:', extensionEnabled ? 'ENABLED' : 'DISABLED');
            
            startStockly();
        });
    } else {
        // Chrome storage not available, use default state
        console.log('⚠️ Chrome storage not available, using default state');
        extensionEnabled = true;
        startStockly();
    }
}

// Start Stockly features
function startStockly() {
    if (!extensionEnabled) {
        console.log('Extension is disabled, not injecting');
        return;
    }
    
    // Inject widget immediately
    injectStocklyWidget();
    
    // Try to insert button immediately
    insertAnalyzeButton();
    
    // Also set up retry mechanism
    let retryCount = 0;
    const maxRetries = 10;
    const retryInterval = setInterval(() => {
        if (document.getElementById('analyze-btn-ext') || retryCount >= maxRetries) {
            clearInterval(retryInterval);
            if (retryCount >= maxRetries) {
                console.log('⚠️ Could not find title element after', maxRetries, 'attempts');
            }
            return;
        }
        console.log('🔄 Retry', retryCount + 1, '- Looking for title element...');
        insertAnalyzeButton();
        retryCount++;
    }, 500); // Try every 500ms
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStockly);
} else {
    // DOM already loaded
    initializeStockly();
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
        
        return true; // Keep message channel open for async response
    });
}

// ===== OBSERVERS =====
// Use MutationObserver to watch for the title element appearing
const observer = new MutationObserver(() => {
    insertAnalyzeButton();
});

observer.observe(document.body, { childList: true, subtree: true });
