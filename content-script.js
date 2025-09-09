// Title format example:
// <title>AMZN - $236.10 | Robinhood</title>
// 

// Function to extract stock ticker from page title
function getStockTicker() {
   const title = document.title;
   const ticker = title.split(' - ')[0];
   return ticker;
}

// tracks last title to detect changes
let lastTitle = document.title;

// Function that checks for title changes every second
setInterval(() => {
   if (document.title !== lastTitle) {
       lastTitle = document.title;
       // Title changed, get new ticker
       const newTicker = getStockTicker();
       console.log("Stock:", newTicker);
   }
}, 1000);





