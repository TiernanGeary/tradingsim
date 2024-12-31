const apiBaseUrl = 'http://127.0.0.1:5000';
const stockInfoDiv = document.getElementById('stockInfo');
const transactionHistoryTable = document.getElementById('transactionHistory');
let currentPage = 1;
let totalPages = 1;

// Fetch and display wallet and portfolio info
async function getWalletInfo() {
    try {
        const response = await fetch(`${apiBaseUrl}/wallet`);
        const data = await response.json();
        document.getElementById('cashBalance').textContent = data.wallet.toFixed(2);
        document.getElementById('portfolioBalance').textContent = JSON.stringify(data.portfolio, null, 2);
    } catch (error) {
        console.error('Error fetching wallet info:', error);
    }
}


// Search for Stock
document.getElementById('searchButton').addEventListener('click', async () => {
    const ticker = document.getElementById('searchTicker').value.toUpperCase();
    
    // Check if ticker is valid
    if (!ticker) {
        alert('Please enter a ticker symbol.');
        return;
    }

    // Mock stock price for demo (replace with yfinance or any API in production)
    const price = (Math.random() * 100).toFixed(2); // Random price for now
    document.getElementById('stockName').textContent = `Ticker: ${ticker}`;
    document.getElementById('stockPrice').textContent = `Price: $${price}`;
    
    // Show stock information panel
    stockInfoDiv.style.display = 'block';

    // Add event listeners for Buy/Sell
    document.getElementById('buyButton').onclick = () => tradeStock('buy', ticker, price);
    document.getElementById('sellButton').onclick = () => tradeStock('sell', ticker, price);
});

// Buy or Sell Stock
async function tradeStock(action, ticker, price) {
    const quantity = parseInt(document.getElementById('quantity').value);
    const response = await fetch(`${apiBaseUrl}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, quantity, price })
    });
    const result = await response.json();
    if (result.success) {
        alert(`${action === 'buy' ? 'Bought' : 'Sold'} ${quantity} shares of ${ticker}`);
        getWalletInfo();
        getTransactionHistory(currentPage);
    } else {
        alert(result.message || 'An error occurred');
    }
}

// Fetch Transaction History
async function getTransactionHistory(page = 1) {
    const response = await fetch(`${apiBaseUrl}/get-history?page=${page}`);
    const data = await response.json();
    updateTransactionHistory(data.transaction_history);
    totalPages = data.total_pages;
    updatePaginationControls();
}

// Update Transaction History Table
function updateTransactionHistory(history) {
    transactionHistoryTable.innerHTML = '';
    history.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.type}</td>
            <td>${transaction.ticker}</td>
            <td>${transaction.quantity}</td>
            <td>$${transaction.price.toFixed(2)}</td>
            <td>$${transaction.total.toFixed(2)}</td>
            <td>${transaction.timestamp}</td>
        `;
        transactionHistoryTable.appendChild(row);
    });
}

// Update Pagination Controls
function updatePaginationControls() {
    document.getElementById('currentPage').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        getTransactionHistory(currentPage);
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        getTransactionHistory(currentPage);
    }
});

// Initialize
getWalletInfo();
getTransactionHistory();
