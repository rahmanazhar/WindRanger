// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract WindRanger is ERC20, Ownable, ReentrancyGuard {
    uint256 public tokenPrice; // Price in Wei
    uint256 public immutable INITIAL_SUPPLY;
    
    // Transaction history
    struct Transaction {
        address user;
        TransactionType txType;
        uint256 amount;
        uint256 price;
        uint256 timestamp;
    }
    
    enum TransactionType { BUY, SELL }
    
    Transaction[] public transactions;
    
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event TokensSold(address indexed seller, uint256 amount, uint256 payment);

    constructor(
        uint256 initialSupply,
        uint256 initialPrice
    ) ERC20("WindRanger", "WRT") {
        INITIAL_SUPPLY = initialSupply;
        tokenPrice = initialPrice;
        _mint(address(this), initialSupply);
    }

    function buyTokens() external payable nonReentrant {
        require(msg.value > 0, "Must send ETH to buy tokens");
        uint256 tokensToBuy = (msg.value * (10 ** decimals())) / tokenPrice;
        require(tokensToBuy > 0, "Amount too small");
        require(balanceOf(address(this)) >= tokensToBuy, "Not enough tokens in contract");

        _transfer(address(this), msg.sender, tokensToBuy);
        
        // Record transaction
        transactions.push(Transaction({
            user: msg.sender,
            txType: TransactionType.BUY,
            amount: tokensToBuy,
            price: tokenPrice,
            timestamp: block.timestamp
        }));
        
        emit TokensPurchased(msg.sender, tokensToBuy, msg.value);
    }

    function sellTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Not enough tokens");

        // Calculate ETH to return
        uint256 ethToReturn = (amount * tokenPrice) / (10 ** decimals());
        require(address(this).balance >= ethToReturn, "Not enough ETH in contract");

        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Record transaction
        transactions.push(Transaction({
            user: msg.sender,
            txType: TransactionType.SELL,
            amount: amount,
            price: tokenPrice,
            timestamp: block.timestamp
        }));
        
        // Send ETH to seller
        (bool sent, ) = msg.sender.call{value: ethToReturn}("");
        require(sent, "Failed to send ETH");

        emit TokensSold(msg.sender, amount, ethToReturn);
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    function getTransactions(uint256 start, uint256 limit) external view returns (Transaction[] memory) {
        uint256 end = start + limit;
        if (end > transactions.length) {
            end = transactions.length;
        }
        require(start < end, "Invalid range");
        
        Transaction[] memory result = new Transaction[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = transactions[transactions.length - 1 - i];
        }
        return result;
    }

    function getTokenBalance(address account) external view returns (uint256) {
        return balanceOf(account);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
