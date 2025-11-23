# 📈 Stockly - AI-Powered Stock Analysis Chrome Extension

> Real-time stock and cryptocurrency analysis powered by AI, delivered directly in your browser while using Robinhood.

Stockly is a Chrome extension that provides intelligent market analysis, sentiment scoring, and actionable insights for stocks and cryptocurrencies. Get AI-powered analysis without leaving your trading platform.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![Node.js](https://img.shields.io/badge/Node.js-Backend-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)

---

## 🎯 Features

### 🤖 **AI-Powered Analysis**
- GPT-4 powered market analysis using OpenRouter
- Real-time sentiment scoring from 100+ news sources
- Technical indicators and price action analysis
- Personalized investment checklist

### 📊 **Real-Time Data**
- Live stock prices via Alpha Vantage API
- Cryptocurrency data from CoinGecko
- News headlines aggregated from NewsAPI
- Automatic price updates every 30 seconds

### 🔐 **Secure Authentication**
- Google OAuth 2.0 integration
- Token-based API authorization
- Encrypted user data storage
- Privacy-first design

### 🎨 **Seamless Integration**
- Works directly on Robinhood.com
- Clean, non-intrusive UI overlay
- Mobile-responsive design
- Dark mode compatible

---

## 🚀 How It Works

```
User browses to stock on Robinhood
          ↓
Extension detects ticker symbol (e.g., AAPL)
          ↓
Sends authenticated request to backend
          ↓
Backend aggregates data from:
  • OpenRouter (AI analysis)
  • NewsAPI (sentiment)
  • Alpha Vantage (prices)
  • CoinGecko (crypto)
          ↓
Returns formatted analysis widget
          ↓
Extension displays widget on page
```

---

## 🏗️ Architecture

### **Frontend (Chrome Extension)**
- **Content Script**: Detects page context and injects UI
- **Background Worker**: Manages API calls and authentication
- **Popup UI**: Quick access to settings and analysis

### **Backend API**
- **Node.js/Express**: RESTful API server
- **PostgreSQL**: User data and session management
- **Railway**: Cloud deployment with auto-scaling

### **External APIs**
- OpenRouter (GPT-4)
- NewsAPI
- Alpha Vantage
- CoinGecko

---

## 📦 Installation

### **From Source** (Developer Mode)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stockly-extension.git
   cd stockly-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint**
   Edit `config.js`:
   ```javascript
   const API_BASE_URL = 'https://stockly-backend-production.up.railway.app';
   ```

4. **Load extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `stockly-extension` folder

5. **Sign in with Google**
   - Click the Stockly icon in your Chrome toolbar
   - Authenticate with your Google account
   - Start analyzing stocks on Robinhood!

---

## 🛠️ Tech Stack

### **Frontend**
- **JavaScript (ES6+)**: Core extension logic
- **Chrome Extension APIs**: Manifest V3
- **HTML/CSS**: UI components
- **Fetch API**: HTTP requests

### **Backend** ([See Backend Repo](https://github.com/yourusername/stockly-backend))
- **Node.js + Express**: API server
- **PostgreSQL**: Database
- **OAuth 2.0**: Authentication
- **Railway**: Hosting

### **AI & Data**
- **OpenRouter**: GPT-4 powered analysis
- **NewsAPI**: Real-time headlines
- **Alpha Vantage**: Stock market data
- **CoinGecko**: Cryptocurrency data

---

## 📁 Project Structure

```
stockly-extension/
├── manifest.json          # Extension configuration
├── content.js            # Main content script (injected into pages)
├── background.js         # Service worker for API calls
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── styles.css            # Extension styling
├── config.js             # API endpoint configuration
├── assets/
│   ├── icon16.png        # Extension icons
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

---

## 🔑 Configuration

### **API Endpoint**
The extension connects to the backend API. Update `config.js`:

```javascript
const API_BASE_URL = 'https://your-backend-url.railway.app';
```

### **Google OAuth**
Backend requires Google OAuth credentials. See [Backend Setup](https://github.com/yourusername/stockly-backend#-environment-variables).

---

## 🎨 Usage

### **On Robinhood**
1. Navigate to any stock page (e.g., `robinhood.com/stocks/AAPL`)
2. Stockly automatically detects the ticker
3. Click the floating "Analyze" button
4. View AI-powered analysis, sentiment, and news

### **On Any Page**
1. Highlight a ticker symbol (e.g., "TSLA")
2. Right-click → "Analyze with Stockly"
3. Get instant analysis in a popup

### **Settings**
- Click the Stockly icon in Chrome toolbar
- Configure auto-analysis preferences
- Manage authentication
- View usage statistics

---

## 🧪 Development

### **Local Development**

1. **Start the backend locally**
   ```bash
   cd stockly-backend
   npm install
   npm start
   ```

2. **Update API endpoint**
   ```javascript
   // config.js
   const API_BASE_URL = 'http://localhost:8080';
   ```

3. **Reload extension**
   - Go to `chrome://extensions/`
   - Click reload icon on Stockly card
   - Test changes

### **Debugging**

- **Content Script**: Open DevTools on Robinhood page
- **Background Worker**: Go to `chrome://extensions/` → "Inspect views: service worker"
- **Popup**: Right-click extension icon → "Inspect popup"

---

## 📊 API Integration

### **Authentication Flow**

```javascript
// 1. User clicks "Sign in with Google"
chrome.identity.getAuthToken({ interactive: true }, (token) => {
  
  // 2. Send token to backend
  fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    body: JSON.stringify({ idToken: token })
  })
  
  // 3. Store auth token
  .then(res => res.json())
  .then(data => {
    chrome.storage.local.set({ authToken: data.user.token });
  });
});
```

### **Stock Analysis Request**

```javascript
// 1. Detect ticker on page
const ticker = detectTickerFromURL(); // e.g., "AAPL"

// 2. Get stored auth token
chrome.storage.local.get(['authToken'], (result) => {
  
  // 3. Request analysis
  fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticker: ticker,
      isCrypto: false,
      token: result.authToken
    })
  })
  
  // 4. Display result
  .then(res => res.json())
  .then(data => {
    displayAnalysisWidget(data.result);
  });
});
```

---

## 🔒 Security & Privacy

### **Data Collection**
- **Collected**: Email, name, Google profile picture (for authentication)
- **NOT Collected**: Browsing history, trading activity, financial data
- **Storage**: User data stored securely in PostgreSQL with encrypted tokens

### **API Security**
- All requests use token-based authentication
- Backend validates tokens on every request
- HTTPS-only communication
- Rate limiting to prevent abuse

### **Permissions**
The extension requires these Chrome permissions:
- `activeTab`: To detect stock tickers on current page
- `storage`: To save authentication tokens locally
- `identity`: For Google OAuth
- `host_permissions`: To inject UI on Robinhood.com

---

## 🚧 Roadmap

### **Coming Soon**
- [ ] Support for more trading platforms (E*TRADE, TD Ameritrade)
- [ ] Portfolio tracking and performance analytics
- [ ] Price alerts and notifications
- [ ] Historical analysis comparison
- [ ] Customizable analysis templates

### **Future Enhancements**
- [ ] Mobile app (iOS/Android)
- [ ] Options analysis and Greeks calculator
- [ ] Community sentiment from Reddit/Twitter
- [ ] Multi-language support

---

## 🐛 Known Issues

- **Issue**: Analysis may be slow during market hours due to API rate limits
  - **Workaround**: Results are cached for 5 minutes per ticker

- **Issue**: Extension may not detect ticker on all pages
  - **Workaround**: Use right-click "Analyze with Stockly" on highlighted text

- **Issue**: OAuth token may expire after 30 days
  - **Workaround**: Sign in again when prompted

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### **Development Guidelines**
- Follow existing code style
- Add comments for complex logic
- Test on multiple pages before submitting
- Update README if adding features

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Riad Benyamna**
- University of Southern Mississippi
- Computer Science Student
- Expected Graduation: May 2027

📫 **Contact**: riad.benyamna2020@gmail.com  
🔗 **LinkedIn**: [linkedin.com/in/riad-benyamna](https://linkedin.com/in/riad-benyamna)  
💻 **GitHub**: [github.com/Jinmamak](https://github.com/Jinmamak)

---

## ⚖️ Legal Disclaimer

**IMPORTANT**: Stockly is an educational tool for market data aggregation and analysis. 

- **Not Financial Advice**: Information provided is for educational purposes only. Always conduct your own research.
- **Investment Risk**: All investments carry risk. Past performance does not guarantee future results.
- **No Liability**: The creators assume no liability for financial decisions made using this tool.
- **Consult Professionals**: Seek advice from qualified financial advisors before making investment decisions.

---

## 🙏 Acknowledgments

- **APIs**: OpenRouter, NewsAPI, Alpha Vantage, CoinGecko
- **Hosting**: Railway
- **Authentication**: Google OAuth 2.0
- **Inspiration**: Built to democratize access to AI-powered market analysis

---

## 📚 Additional Resources

- [Backend Repository](https://github.com/yourusername/stockly-backend)
- [API Documentation](https://github.com/yourusername/stockly-backend#-api-endpoints)
- [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

**⭐ If you find this project useful, please consider starring the repo!**

