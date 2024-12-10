import { CONFIG, CONTRACT_ABI } from '../config.js';

export class BlockchainService {
    constructor() {
        this.web3 = new Web3('http://localhost:8545');
        this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
        this.account = null;
        this.provider = null;
        this.currentWallet = null;
        this.currentNetwork = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            await this.loadLastWallet();
            this.setupEventListeners();
            await this.loadPublicData();
            this.isInitialized = true;
            this.startDataRefresh();
        } catch (error) {
            console.error('Initialization error:', error);
            throw error;
        }
    }

    startDataRefresh() {
        // Refresh data every 10 seconds
        setInterval(async () => {
            if (this.isInitialized) {
                await this.loadPublicData();
            }
        }, CONFIG.UPDATE_INTERVAL);
    }

    async loadPublicData() {
        try {
            const [tokenPrice, txCount] = await Promise.all([
                this.contract.methods.tokenPrice().call(),
                this.contract.methods.getTransactionCount().call()
            ]);

            // Load recent transactions
            if (parseInt(txCount) > 0) {
                const limit = Math.min(50, parseInt(txCount));
                const transactions = await this.contract.methods.getTransactions(0, limit).call();
                document.dispatchEvent(new CustomEvent('transactionsLoaded', { detail: transactions }));
            }

            const contractBalance = await this.contract.methods.getContractBalance().call();

            document.dispatchEvent(new CustomEvent('publicDataLoaded', {
                detail: {
                    tokenPrice: this.web3.utils.fromWei(tokenPrice, 'ether'),
                    contractBalance: this.web3.utils.fromWei(contractBalance, 'ether')
                }
            }));
        } catch (error) {
            console.error('Error loading public data:', error);
        }
    }

    async loadLastWallet() {
        const lastWallet = localStorage.getItem('lastWallet');
        if (lastWallet) {
            await this.connectWallet(lastWallet);
        }
    }

    async setupContract() {
        this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
    }

    setupEventListeners() {
        if (this.provider) {
            this.provider.on('accountsChanged', (accounts) => {
                this.account = accounts[0];
                document.dispatchEvent(new CustomEvent('accountChanged'));
            });
            
            this.provider.on('chainChanged', (chainId) => {
                this.currentNetwork = parseInt(chainId);
                document.dispatchEvent(new CustomEvent('networkChanged', { detail: this.currentNetwork }));
            });

            this.provider.on('disconnect', () => {
                this.disconnect();
            });
        }
    }

    async connectWallet(walletType = 'metamask') {
        try {
            switch (walletType) {
                case 'metamask':
                    if (typeof window.ethereum === 'undefined') {
                        throw new Error('MetaMask is not installed');
                    }
                    this.provider = window.ethereum;
                    break;

                case 'walletconnect':
                    if (typeof WalletConnectProvider === 'undefined') {
                        throw new Error('WalletConnect provider not loaded');
                    }
                    this.provider = new WalletConnectProvider({
                        rpc: Object.fromEntries(
                            Object.entries(CONFIG.SUPPORTED_NETWORKS).map(
                                ([chainId, network]) => [chainId, network.rpcUrl]
                            )
                        )
                    });
                    await this.provider.enable();
                    break;

                default:
                    throw new Error('Unsupported wallet type');
            }

            this.web3 = new Web3(this.provider);
            const accounts = await this.web3.eth.requestAccounts();
            this.account = accounts[0];
            this.currentWallet = walletType;
            this.currentNetwork = parseInt(await this.web3.eth.getChainId());

            localStorage.setItem('lastWallet', walletType);
            await this.setupContract();
            this.setupEventListeners();

            return this.account;
        } catch (error) {
            console.error('Wallet connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.currentWallet === 'walletconnect' && this.provider) {
            await this.provider.disconnect();
        }
        this.web3 = new Web3('http://localhost:8545');
        await this.setupContract();
        this.account = null;
        this.provider = null;
        this.currentWallet = null;
        localStorage.removeItem('lastWallet');
        document.dispatchEvent(new CustomEvent('walletDisconnected'));
    }

    async switchNetwork(chainId) {
        const network = CONFIG.SUPPORTED_NETWORKS[chainId];
        if (!network) {
            throw new Error('Unsupported network');
        }

        try {
            await this.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await this.provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: `0x${chainId.toString(16)}`,
                        chainName: network.name,
                        nativeCurrency: network.nativeCurrency,
                        rpcUrls: [network.rpcUrl],
                        blockExplorerUrls: [network.blockExplorer]
                    }]
                });
            } else {
                throw switchError;
            }
        }
    }

    async requestFaucet() {
        const chainId = await this.web3.eth.getChainId();
        const network = CONFIG.SUPPORTED_NETWORKS[chainId];
        
        if (!network || !network.faucet) {
            throw new Error('No faucet available for this network');
        }

        window.open(network.faucet, '_blank');
    }

    async getBalance(address) {
        const balance = await this.web3.eth.getBalance(address);
        return this.web3.utils.fromWei(balance, 'ether');
    }

    async getTokenBalance(address) {
        const balance = await this.contract.methods.balanceOf(address).call();
        return this.web3.utils.fromWei(balance, 'ether');
    }

    async getTokenPrice() {
        const price = await this.contract.methods.tokenPrice().call();
        return this.web3.utils.fromWei(price, 'ether');
    }

    async getContractBalance() {
        const balance = await this.contract.methods.getContractBalance().call();
        return this.web3.utils.fromWei(balance, 'ether');
    }

    async buyTokens(amount) {
        const weiAmount = this.web3.utils.toWei(amount.toString(), 'ether');
        const tx = await this.contract.methods.buyTokens().send({
            from: this.account,
            value: weiAmount
        });
        await this.loadPublicData();
        return tx;
    }

    async sellTokens(amount) {
        const weiAmount = this.web3.utils.toWei(amount.toString(), 'ether');
        const tx = await this.contract.methods.sellTokens(weiAmount).send({
            from: this.account
        });
        await this.loadPublicData();
        return tx;
    }

    async calculateBuyEstimate(amount) {
        if (!amount || amount <= 0) return '0';
        const price = await this.contract.methods.tokenPrice().call();
        const weiAmount = this.web3.utils.toWei(amount.toString(), 'ether');
        const tokenAmount = (BigInt(weiAmount) * BigInt(1e18)) / BigInt(price);
        return this.web3.utils.fromWei(tokenAmount.toString(), 'ether');
    }

    async calculateSellEstimate(amount) {
        if (!amount || amount <= 0) return '0';
        const price = await this.contract.methods.tokenPrice().call();
        const weiAmount = this.web3.utils.toWei(amount.toString(), 'ether');
        const ethAmount = (BigInt(weiAmount) * BigInt(price)) / BigInt(1e18);
        return this.web3.utils.fromWei(ethAmount.toString(), 'ether');
    }

    getCurrentAccount() {
        return this.account;
    }

    getCurrentNetwork() {
        return this.currentNetwork;
    }

    getCurrentWallet() {
        return this.currentWallet;
    }

    isConnected() {
        return !!this.account;
    }
}
