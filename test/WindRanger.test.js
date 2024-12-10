const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WindRanger", function () {
  let WindRanger;
  let windranger;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const initialSupply = ethers.utils.parseEther("1000000");
  const initialPrice = ethers.utils.parseEther("0.001");

  beforeEach(async function () {
    WindRanger = await ethers.getContractFactory("WindRanger");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    windranger = await WindRanger.deploy(initialSupply, initialPrice);
    await windranger.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct initial supply", async function () {
      const contractBalance = await windranger.balanceOf(windranger.address);
      expect(contractBalance).to.equal(initialSupply);
    });

    it("Should set the correct initial price", async function () {
      const tokenPrice = await windranger.tokenPrice();
      expect(tokenPrice).to.equal(initialPrice);
    });
  });

  describe("Transactions", function () {
    it("Should allow users to buy tokens", async function () {
      const buyAmount = ethers.utils.parseEther("1.0"); // 1 ETH
      const expectedTokens = buyAmount.mul(ethers.utils.parseEther("1")).div(initialPrice);

      await expect(
        windranger.connect(addr1).buyTokens({ value: buyAmount })
      ).to.emit(windranger, "TokensPurchased")
        .withArgs(addr1.address, expectedTokens, buyAmount);

      const balance = await windranger.balanceOf(addr1.address);
      expect(balance).to.equal(expectedTokens);
    });

    it("Should allow users to sell tokens", async function () {
      // First buy tokens
      const buyAmount = ethers.utils.parseEther("1.0");
      await windranger.connect(addr1).buyTokens({ value: buyAmount });
      const tokenBalance = await windranger.balanceOf(addr1.address);

      // Then sell half of them
      const sellAmount = tokenBalance.div(2);
      const expectedEth = sellAmount.mul(initialPrice).div(ethers.utils.parseEther("1"));

      await expect(
        windranger.connect(addr1).sellTokens(sellAmount)
      ).to.emit(windranger, "TokensSold")
        .withArgs(addr1.address, sellAmount, expectedEth);

      const newBalance = await windranger.balanceOf(addr1.address);
      expect(newBalance).to.equal(tokenBalance.sub(sellAmount));
    });

    it("Should fail when selling more tokens than owned", async function () {
      const sellAmount = ethers.utils.parseEther("1.0");
      await expect(
        windranger.connect(addr1).sellTokens(sellAmount)
      ).to.be.revertedWith("Not enough tokens");
    });

    it("Should fail when buying with zero ETH", async function () {
      await expect(
        windranger.connect(addr1).buyTokens({ value: 0 })
      ).to.be.revertedWith("Must send ETH to buy tokens");
    });
  });

  describe("Transaction History", function () {
    it("Should record buy transactions", async function () {
      const buyAmount = ethers.utils.parseEther("1.0");
      await windranger.connect(addr1).buyTokens({ value: buyAmount });

      const txCount = await windranger.getTransactionCount();
      expect(txCount).to.equal(1);

      const [transactions] = await windranger.getTransactions(0, 1);
      expect(transactions.user).to.equal(addr1.address);
      expect(transactions.txType).to.equal(0); // BUY
    });

    it("Should record sell transactions", async function () {
      // First buy tokens
      const buyAmount = ethers.utils.parseEther("1.0");
      await windranger.connect(addr1).buyTokens({ value: buyAmount });
      const tokenBalance = await windranger.balanceOf(addr1.address);

      // Then sell them
      await windranger.connect(addr1).sellTokens(tokenBalance);

      const txCount = await windranger.getTransactionCount();
      expect(txCount).to.equal(2); // One buy + one sell

      const [lastTx] = await windranger.getTransactions(0, 1);
      expect(lastTx.user).to.equal(addr1.address);
      expect(lastTx.txType).to.equal(1); // SELL
    });
  });

  describe("Contract Balance", function () {
    it("Should track contract ETH balance correctly", async function () {
      const buyAmount = ethers.utils.parseEther("1.0");
      await windranger.connect(addr1).buyTokens({ value: buyAmount });

      const contractBalance = await windranger.getContractBalance();
      expect(contractBalance).to.equal(buyAmount);
    });

    it("Should update contract ETH balance after sells", async function () {
      // First buy tokens
      const buyAmount = ethers.utils.parseEther("1.0");
      await windranger.connect(addr1).buyTokens({ value: buyAmount });
      const tokenBalance = await windranger.balanceOf(addr1.address);

      // Then sell them
      await windranger.connect(addr1).sellTokens(tokenBalance);

      const contractBalance = await windranger.getContractBalance();
      expect(contractBalance).to.equal(0);
    });
  });
});
