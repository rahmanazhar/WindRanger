import { CONFIG } from '../config.js';

export class UIService {
    constructor() {
        this.elements = {
            // Wallet controls
            walletAddress: document.getElementById('wallet-address'),
            walletSelector: document.getElementById('wallet-selector'),
            connectWallet: document.getElementById('connect-wallet'),
            disconnectWallet: document.getElementById('disconnect-wallet'),
            networkSelector: document.getElementById('network-selector'),
            faucetButton: document.getElementById('faucet-button'),
            walletSection: document.getElementById('wallet-section'),
            
            // Token info
            tokenPrice: document.getElementById('token-price'),
            contractBalance: document.getElementById('contract-balance'),
            
            // Balances
            ethBalance: document.getElementById('eth-balance'),
            tokenBalance: document.getElementById('token-balance'),
            
            // Trading
            buyAmount: document.getElementById('buy-amount'),
            sellAmount: document.getElementById('sell-amount'),
            buyEstimate: document.getElementById('buy-estimate'),
            sellEstimate: document.getElementById('sell-estimate'),
            buyTokens: document.getElementById('buy-tokens'),
            sellTokens: document.getElementById('sell-tokens'),
            
            // Transactions
            transactionsList: document.getElementById('transactions-list'),
            
            // Notifications
            notification: document.getElementById('notification')
        };

        this.initializeSelectors();
    }

    initializeSelectors() {
        // Initialize wallet selector
        const walletOptions = Object.entries(CONFIG.SUPPORTED_WALLETS)
            .map(([id, wallet]) => `
                <option value="${id}">
                    ${wallet.name}
                </option>
            `).join('');
        this.elements.walletSelector.innerHTML = `
            <option value="" disabled selected>Select Wallet</option>
            ${walletOptions}
        `;

        // Initialize network selector
        const networkOptions = Object.entries(CONFIG.SUPPORTED_NETWORKS)
            .map(([chainId, network]) => `
                <option value="${chainId}">
                    ${network.name} (${network.nativeCurrency.symbol})
                </option>
            `).join('');
        this.elements.networkSelector.innerHTML = `
            <option value="" disabled selected>Select Network</option>
            ${networkOptions}
        `;

        // Initially hide wallet-dependent elements
        this.elements.networkSelector.style.display = 'none';
        this.elements.disconnectWallet.style.display = 'none';
        this.elements.walletSection.style.display = 'none';
    }

    setupEventListeners(callbacks) {
        // Wallet connection
        this.elements.walletSelector.addEventListener('change', () => {
            this.elements.connectWallet.disabled = false;
        });
        this.elements.connectWallet.addEventListener('click', () => {
            const selectedWallet = this.elements.walletSelector.value;
            if (selectedWallet) {
                callbacks.onWalletSelect(selectedWallet);
            } else {
                this.showNotification('Please select a wallet', 'error');
            }
        });
        this.elements.disconnectWallet.addEventListener('click', callbacks.onDisconnect);

        // Network switching
        this.elements.networkSelector.addEventListener('change', (e) => 
            callbacks.onNetworkSwitch(parseInt(e.target.value)));

        // Faucet
        this.elements.faucetButton.addEventListener('click', callbacks.onFaucetRequest);

        // Trading
        this.elements.buyTokens.addEventListener('click', callbacks.onBuyTokens);
        this.elements.sellTokens.addEventListener('click', callbacks.onSellTokens);
        this.elements.buyAmount.addEventListener('input', (e) => 
            callbacks.onBuyAmountChange(e.target.value));
        this.elements.sellAmount.addEventListener('input', (e) => 
            callbacks.onSellAmountChange(e.target.value));
    }

    updateWalletInfo(account, walletType) {
        if (!account) {
            this.elements.walletAddress.textContent = '';
            this.elements.walletSelector.style.display = 'block';
            this.elements.connectWallet.style.display = 'block';
            this.elements.connectWallet.disabled = true;
            this.elements.disconnectWallet.style.display = 'none';
            this.elements.networkSelector.style.display = 'none';
            this.elements.walletAddress.style.display = 'none';
            this.elements.walletSection.style.display = 'none';
            return;
        }
        
        this.elements.walletAddress.textContent = 
            `${account.substring(0, 6)}...${account.substring(38)}`;
        this.elements.walletSelector.style.display = 'none';
        this.elements.connectWallet.style.display = 'none';
        this.elements.disconnectWallet.style.display = 'block';
        this.elements.networkSelector.style.display = 'block';
        this.elements.walletAddress.style.display = 'block';
        this.elements.walletSection.style.display = 'block';

        // Update wallet selector
        this.elements.walletSelector.value = walletType;
    }

    updateNetworkInfo(chainId) {
        const network = CONFIG.SUPPORTED_NETWORKS[chainId];
        if (!network) return;

        this.elements.networkSelector.value = chainId;
        
        // Update currency symbols
        const symbol = network.nativeCurrency.symbol;
        this.elements.ethBalance.dataset.symbol = symbol;
        this.elements.contractBalance.dataset.symbol = symbol;
        this.elements.tokenPrice.dataset.symbol = symbol;
        this.elements.buyAmount.placeholder = `Amount in ${symbol}`;
        this.elements.sellEstimate.dataset.symbol = symbol;

        // Show/hide faucet button
        this.elements.faucetButton.style.display = network.faucet ? 'block' : 'none';
    }

    updateBalances(nativeBalance, tokenBalance, chainId) {
        const network = CONFIG.SUPPORTED_NETWORKS[chainId];
        const symbol = network ? network.nativeCurrency.symbol : 'ETH';
        
        this.elements.ethBalance.textContent = 
            `${parseFloat(nativeBalance).toFixed(4)} ${symbol}`;
        this.elements.tokenBalance.textContent = 
            `${parseFloat(tokenBalance).toFixed(4)} ${CONFIG.TOKEN_SYMBOL}`;
    }

    updateTokenInfo(price, contractBalance, chainId) {
        const network = CONFIG.SUPPORTED_NETWORKS[chainId];
        const symbol = network ? network.nativeCurrency.symbol : 'ETH';
        
        this.elements.tokenPrice.textContent = 
            `${parseFloat(price).toFixed(6)} ${symbol}`;
        this.elements.contractBalance.textContent = 
            `${parseFloat(contractBalance).toFixed(4)} ${symbol}`;
    }

    updateTransactions(transactions) {
        if (!this.elements.transactionsList) return;

        this.elements.transactionsList.innerHTML = transactions.map(tx => {
            const date = new Date(parseInt(tx.timestamp) * 1000);
            const typeClass = tx.txType.toLowerCase();
            const types = ['BUY', 'SELL'];
            
            return `
                <div class="transaction-item">
                    <span class="transaction-type ${typeClass}">${types[tx.txType]}</span>
                    <span>${this.formatAmount(tx.amount)} ${CONFIG.TOKEN_SYMBOL}</span>
                    <span>${this.formatAmount(tx.price)} ETH</span>
                    <span>${this.formatAmount(tx.amount * tx.price)} ETH</span>
                    <span class="transaction-address">${this.formatAddress(tx.user)}</span>
                    <span>${date.toLocaleString()}</span>
                </div>
            `;
        }).join('');
    }

    updateBuyEstimate(amount) {
        this.elements.buyEstimate.textContent = amount ? 
            `Estimated ${CONFIG.TOKEN_SYMBOL}: ${parseFloat(amount).toFixed(4)} ${CONFIG.TOKEN_SYMBOL}` : '';
    }

    updateSellEstimate(amount, chainId) {
        if (!amount) {
            this.elements.sellEstimate.textContent = '';
            return;
        }
        const network = CONFIG.SUPPORTED_NETWORKS[chainId];
        const symbol = network ? network.nativeCurrency.symbol : 'ETH';
        this.elements.sellEstimate.textContent = 
            `Estimated ${symbol}: ${parseFloat(amount).toFixed(4)} ${symbol}`;
    }

    showNotification(message, type = 'success') {
        this.elements.notification.textContent = message;
        this.elements.notification.style.backgroundColor = type === 'error' ? '#e74c3c' : '#2ecc71';
        this.elements.notification.classList.add('show');
        
        setTimeout(() => {
            this.elements.notification.classList.remove('show');
        }, CONFIG.NOTIFICATION_DURATION);
    }

    clearInputs() {
        this.elements.buyAmount.value = '';
        this.elements.sellAmount.value = '';
        this.elements.buyEstimate.textContent = '';
        this.elements.sellEstimate.textContent = '';
    }

    enableTrading() {
        this.elements.buyTokens.disabled = false;
        this.elements.sellTokens.disabled = false;
        this.elements.buyAmount.disabled = false;
        this.elements.sellAmount.disabled = false;
    }

    disableTrading() {
        this.elements.buyTokens.disabled = true;
        this.elements.sellTokens.disabled = true;
        this.elements.buyAmount.disabled = true;
        this.elements.sellAmount.disabled = true;
    }

    formatAddress(address) {
        return `${address.substring(0, 6)}...${address.substring(38)}`;
    }

    formatAmount(amount) {
        return parseFloat(amount).toFixed(4);
    }
}
