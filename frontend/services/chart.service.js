export class ChartService {
    constructor() {
        this.priceChart = null;
        this.priceHistory = [];
        this.transactions = [];
        this.maxDataPoints = 50;
        this.transactionsList = document.getElementById('transactions-list');
    }

    initializePriceChart() {
        const ctx = document.getElementById('price-chart').getContext('2d');
        this.priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'WRT Price',
                    data: [],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + ' ETH';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Price: ${context.parsed.y} ETH`;
                            }
                        }
                    }
                }
            }
        });
    }

    updatePriceChart(price) {
        if (!this.priceChart) {
            this.initializePriceChart();
        }

        const timestamp = new Date().toLocaleTimeString();
        this.priceHistory.push({ price, timestamp });

        // Keep only the last maxDataPoints data points
        if (this.priceHistory.length > this.maxDataPoints) {
            this.priceHistory.shift();
        }

        this.priceChart.data.labels = this.priceHistory.map(data => data.timestamp);
        this.priceChart.data.datasets[0].data = this.priceHistory.map(data => data.price);
        this.priceChart.update();
    }

    addTransaction(type, amount, price, total, address) {
        const transaction = {
            type,
            amount,
            price,
            total,
            address,
            timestamp: new Date()
        };

        this.transactions.unshift(transaction);
        if (this.transactions.length > 50) {
            this.transactions.pop();
        }

        this.updateTransactionsList();
    }

    updateTransactionsList() {
        if (!this.transactionsList) return;

        this.transactionsList.innerHTML = this.transactions.map(tx => `
            <div class="transaction-item">
                <span class="transaction-type ${tx.type.toLowerCase()}">${tx.type}</span>
                <span>${tx.amount} WRT</span>
                <span>${tx.price} ETH</span>
                <span>${tx.total} ETH</span>
                <span class="transaction-address">${this.formatAddress(tx.address)}</span>
                <span>${this.formatTimestamp(tx.timestamp)}</span>
            </div>
        `).join('');
    }

    formatAddress(address) {
        return `${address.substring(0, 6)}...${address.substring(38)}`;
    }

    formatTimestamp(timestamp) {
        return timestamp.toLocaleTimeString();
    }

    clearData() {
        this.priceHistory = [];
        this.transactions = [];
        if (this.priceChart) {
            this.priceChart.destroy();
            this.priceChart = null;
        }
        if (this.transactionsList) {
            this.transactionsList.innerHTML = '';
        }
    }
}
