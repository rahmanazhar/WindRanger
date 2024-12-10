import { CONFIG } from './config.js';
import { BlockchainService } from './services/blockchain.service.js';
import { UIService } from './services/ui.service.js';
import { ChartService } from './services/chart.service.js';

class App {
    constructor() {
        this.blockchain = new BlockchainService();
        this.ui = new UIService();
        this.chart = new ChartService();
        this.init();
    }

    async init() {
        try {
            // Initialize blockchain service
            await this.blockchain.initialize();

            // Setup UI event listeners
            this.ui.setupEventListeners({
                onWalletSelect: this.handleWalletSelect.bind(this),
                onDisconnect: this.handleDisconnect.bind(this),
                onNetworkSwitch: this.handleNetworkSwitch.bind(this),
                onFaucetRequest: this.handleFaucetRequest.bind(this),
                onBuyTokens: this.handleBuyTokens.bind(this),
                onSellTokens: this.handleSellTokens.bind(this),
                onBuyAmountChange: this.handleBuyAmountChange.bind(this),
                onSellAmountChange: this.handleSellAmountChange.bind(this)
            });

            // Setup blockchain event listeners
            document.addEventListener('accountChanged', this.handleAccountChanged.bind(this));
            document.addEventListener('networkChanged', this.handleNetworkChanged.bind(this));
            document.addEventListener('publicDataLoaded', this.handlePublicDataLoaded.bind(this));
            document.addEventListener('transactionsLoaded', this.handleTransactionsLoaded.bind(this));

            // Initialize chart
            this.chart.initialize();

        } catch (error) {
            console.error('Initialization error:', error);
            this.ui.showNotification(error.message, 'error');
        }
    }

    async handleWalletSelect(walletType) {
        try {
            const account = await this.blockchain.connectWallet(walletType);
            this.ui.updateWalletInfo(account, walletType);
            
            const chainId = this.blockchain.getCurrentNetwork();
            this.ui.updateNetworkInfo(chainId);
            
            await this.updateBalances();
            this.ui.enableTrading();
            
        } catch (error) {
            console.error('Wallet connection error:', error);
            this.ui.showNotification(error.message, 'error');
        }
    }

    async handleDisconnect() {
        try {
            await this.blockchain.disconnect();
            this.ui.updateWalletInfo(null);
            this.ui.disableTrading();
            this.ui.clearInputs();
        } catch (error) {
            console.error('Disconnect error:', error);
            this.ui.showNotification(error.message, 'error');
        }
    }

    async handleNetworkSwitch(chainId) {
        try {
            await this.blockchain.switchNetwork(chainId);
            this.ui.updateNetworkInfo(chainId);
            await this.updateBalances();
        } catch (error) {
            console.error('Network switch error:', error);
            this.ui.showNotification(error.message, 'error');
        }
    }

    async handleFaucetRequest() {
        try {
            await this.blockchain.requestFaucet();
        } catch (error) {
            console.error('Faucet request error:', error);
            this.ui.showNotification(error.message, 'error');
        }
    }

    async handleBuyTokens() {
        try {
            const amount = this.ui.elements.buyAmount.value;
            if (!amount || amount <= 0) {
                throw new Error('Please enter a valid amount');
            }
            
            await this.blockchain.buyTokens(amount);
            this.ui.showNotification('Tokens purchased successfully');
            this.ui.clearInputs();
            await this.updateBalances();
            
        } catch (error) {
            console.error('Buy tokens error:', error);
            this.ui.showNotification(error.message, 'error');
        }
    }

    async handleSellTokens() {
        try {
            const amount = this.ui.elements.sellAmount.value;
            if (!amount || amount <= 0) {
                throw new Error('Please enter a valid amount');
            }
            
            await this.blockchain.sellTokens(amount);
            this.ui.showNotification('Tokens sold successfully');
            this.ui.clearInputs();
            await this.updateBalances();
            
        } catch (error) {
            console.error('Sell tokens error:', error);
            this.ui.showNotification(error.message, 'error');
        }
    }

    async handleBuyAmountChange(amount) {
        try {
            if (!amount || amount <= 0) {
                this.ui.updateBuyEstimate('');
                return;
            }
            const estimate = await this.blockchain.calculateBuyEstimate(amount);
            this.ui.updateBuyEstimate(estimate);
        } catch (error) {
            console.error('Buy estimate error:', error);
        }
    }

    async handleSellAmountChange(amount) {
        try {
            if (!amount || amount <= 0) {
                this.ui.updateSellEstimate('');
                return;
            }
            const estimate = await this.blockchain.calculateSellEstimate(amount);
            const chainId = this.blockchain.getCurrentNetwork();
            this.ui.updateSellEstimate(estimate, chainId);
        } catch (error) {
            console.error('Sell estimate error:', error);
        }
    }

    async handleAccountChanged() {
        try {
            const account = this.blockchain.getCurrentAccount();
            const walletType = this.blockchain.getCurrentWallet();
            this.ui.updateWalletInfo(account, walletType);
            
            if (account) {
                await this.updateBalances();
                this.ui.enableTrading();
            } else {
                this.ui.disableTrading();
            }
        } catch (error) {
            console.error('Account change error:', error);
            this.ui.showNotification(error.message, 'error');
        }
    }

    async handleNetworkChanged(event) {
        try {
            const chainId = event.detail;
            this.ui.updateNetworkInfo(chainId);
            await this.updateBalances();
        } catch (error) {
            console.error('Network change error:', error);
            this.ui.showNotification(error.message, 'error');
        }
    }

    async handlePublicDataLoaded(event) {
        try {
            const { tokenPrice, contractBalance } = event.detail;
            const chainId = this.blockchain.getCurrentNetwork();
            this.ui.updateTokenInfo(tokenPrice, contractBalance, chainId);
            this.chart.addDataPoint(tokenPrice);
        } catch (error) {
            console.error('Public data update error:', error);
        }
    }

    handleTransactionsLoaded(event) {
        try {
            const transactions = event.detail;
            this.ui.updateTransactions(transactions);
        } catch (error) {
            console.error('Transactions update error:', error);
        }
    }

    async updateBalances() {
        try {
            const account = this.blockchain.getCurrentAccount();
            if (!account) return;

            const chainId = this.blockchain.getCurrentNetwork();
            const [nativeBalance, tokenBalance] = await Promise.all([
                this.blockchain.getBalance(account),
                this.blockchain.getTokenBalance(account)
            ]);

            this.ui.updateBalances(nativeBalance, tokenBalance, chainId);
        } catch (error) {
            console.error('Balance update error:', error);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
