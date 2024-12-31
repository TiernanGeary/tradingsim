import yfinance as yf
from flask import Flask, request, jsonify
from flask_cors import CORS  # Importing CORS

app = Flask(__name__)

# Enable CORS for the entire app
CORS(app)

# In-memory data storage
wallet = {'cash': 100000.0}  # Starting cash should be 100000.0
portfolio = {}
transaction_history = []

# Function to fetch real-time stock price using yfinance
def get_stock_price(ticker):
    stock = yf.Ticker(ticker)
    data = stock.history(period='1d')  # Fetch 1 day's worth of data
    if not data.empty:
        return data['Close'].iloc[-1]  # Get the closing price of the most recent data
    return None  # Return None if no data is available

# Route for wallet information
@app.route('/wallet', methods=['GET'])
def get_wallet_info():
    return jsonify({'wallet': wallet['cash'], 'portfolio': portfolio})

# Route to search stock price
@app.route('/get-stock-price', methods=['GET'])
def get_stock_price_endpoint():
    ticker = request.args.get('ticker').upper()
    price = get_stock_price(ticker)
    if price:
        return jsonify({'price': price})
    return jsonify({'error': 'Stock not found'}), 404

# Route to perform buy/sell operations
@app.route('/trade', methods=['POST'])
def trade_stock():
    data = request.json
    ticker = data['ticker']
    action = data['action']
    quantity = int(data['quantity'])
    price = data['price']

    if action == 'buy':
        total_cost = price * quantity
        if wallet['cash'] >= total_cost:
            wallet['cash'] -= total_cost
            if ticker in portfolio:
                portfolio[ticker] += quantity
            else:
                portfolio[ticker] = quantity
            # Add to transaction history
            transaction_history.append({'action': 'buy', 'ticker': ticker, 'quantity': quantity, 'price': price, 'time': data['time']})
            return jsonify({'status': 'success', 'wallet': wallet['cash'], 'portfolio': portfolio})
        else:
            return jsonify({'error': 'Insufficient funds'}), 400

    elif action == 'sell':
        if ticker in portfolio and portfolio[ticker] >= quantity:
            wallet['cash'] += price * quantity
            portfolio[ticker] -= quantity
            if portfolio[ticker] == 0:
                del portfolio[ticker]
            # Add to transaction history
            transaction_history.append({'action': 'sell', 'ticker': ticker, 'quantity': quantity, 'price': price, 'time': data['time']})
            return jsonify({'status': 'success', 'wallet': wallet['cash'], 'portfolio': portfolio})
        else:
            return jsonify({'error': 'Not enough shares'}), 400

    return jsonify({'error': 'Invalid action'}), 400

# Route to get transaction history (sorted and paginated)
@app.route('/transaction-history', methods=['GET'])
def get_transaction_history():
    page = int(request.args.get('page', 1))
    start = (page - 1) * 10
    end = start + 10
    sorted_history = sorted(transaction_history, key=lambda x: x['time'], reverse=True)  # Sort by time, most recent first
    return jsonify(sorted_history[start:end])

if __name__ == '__main__':
    app.run(debug=True)
