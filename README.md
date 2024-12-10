# WindRanger Token (WRT)

A decentralized token trading platform built with Solidity, Hardhat, and Web3.js. The platform allows users to buy and sell WRT tokens with ETH through a simple and intuitive interface.

## Features

- Buy and sell WRT tokens with ETH
- Real-time price updates
- Transaction history tracking
- MetaMask wallet integration
- Price chart visualization
- Responsive web interface

## Project Structure

```
WindRanger/
├── contracts/               # Smart contracts
│   └── WindRanger.sol      # Main token contract
├── frontend/               # Web interface
│   ├── services/           # Frontend services
│   │   ├── blockchain.service.js  # Web3 integration
│   │   ├── chart.service.js       # Price chart handling
│   │   └── ui.service.js          # UI management
│   ├── app.js             # Main application logic
│   ├── config.js          # Configuration and ABI
│   ├── index.html         # Main HTML file
│   └── styles.css         # Styling
├── scripts/               # Deployment scripts
│   └── deploy.js          # Contract deployment
└── test/                  # Contract tests
    └── WindRanger.test.js # Contract test suite
```

## Prerequisites

- Node.js v14+ and npm
- MetaMask browser extension
- Git

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/WindRanger.git
cd WindRanger
```

2. Install dependencies:
```bash
npm install
```

3. Start a local Hardhat node:
```bash
npx hardhat node
```

4. Deploy the contract:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

5. Update the contract address in `frontend/config.js` with the deployed contract address

6. Start the frontend server:
```bash
npm run frontend
```

7. Open your browser and navigate to `http://localhost:3000`

## Smart Contract

The WindRanger token contract (`WindRanger.sol`) implements the following functionality:

- ERC20 token standard
- Buy and sell tokens with ETH
- Transaction history tracking
- Contract balance management

### Key Functions

- `buyTokens()`: Purchase WRT tokens with ETH
- `sellTokens(uint256 amount)`: Sell WRT tokens for ETH
- `getTransactions(uint256 start, uint256 limit)`: Get transaction history
- `getContractBalance()`: Get contract's ETH balance

## Frontend

The frontend is built with vanilla JavaScript and Web3.js, providing a clean and responsive interface for interacting with the smart contract.

### Services

- **BlockchainService**: Handles Web3 integration and smart contract interactions
- **UIService**: Manages the user interface and event handling
- **ChartService**: Handles price chart visualization using Chart.js

### Features

- Real-time price updates
- Transaction history display
- Price chart visualization
- Wallet connection management
- Buy/sell token interface
- Network switching support

## Testing

Run the test suite:
```bash
npx hardhat test
```

## Development

1. Make changes to the smart contract
2. Run tests to ensure functionality
3. Deploy the contract to local network
4. Update frontend configuration
5. Test frontend interactions

## Networks

The platform supports the following networks:

- Local Hardhat Network (for development)
- Ethereum Mainnet (future deployment)
- Other EVM-compatible networks (configurable)

## Security

- ReentrancyGuard implementation
- Input validation
- Balance checks
- Error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
