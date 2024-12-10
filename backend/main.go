package main

import (
	"context"
	"log"
	"math/big"
	"net/http"
	"os"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type Server struct {
	client  *ethclient.Client
	contract *TokenMarketplace
}

type TokenBalance struct {
	Address string `json:"address"`
	Balance string `json:"balance"`
}

type TransactionRequest struct {
	Address string `json:"address"`
	Amount  string `json:"amount"`
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Connect to Ethereum node
	client, err := ethclient.Dial(os.Getenv("ETHEREUM_NODE_URL"))
	if err != nil {
		log.Fatal(err)
	}

	// Initialize contract
	contractAddress := common.HexToAddress(os.Getenv("CONTRACT_ADDRESS"))
	contract, err := NewTokenMarketplace(contractAddress, client)
	if err != nil {
		log.Fatal(err)
	}

	server := &Server{
		client:  client,
		contract: contract,
	}

	// Initialize Gin router
	r := gin.Default()

	// Enable CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Routes
	r.GET("/balance/:address", server.getBalance)
	r.GET("/price", server.getTokenPrice)
	r.GET("/contract-balance", server.getContractBalance)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}

func (s *Server) getBalance(c *gin.Context) {
	address := common.HexToAddress(c.Param("address"))
	
	balance, err := s.contract.BalanceOf(&bind.CallOpts{}, address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, TokenBalance{
		Address: address.Hex(),
		Balance: balance.String(),
	})
}

func (s *Server) getTokenPrice(c *gin.Context) {
	price, err := s.contract.TokenPrice(&bind.CallOpts{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"price": price.String()})
}

func (s *Server) getContractBalance(c *gin.Context) {
	balance, err := s.contract.GetContractBalance(&bind.CallOpts{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"balance": balance.String()})
}

// Helper function to convert Wei to Ether
func weiToEther(wei *big.Int) *big.Float {
	f := new(big.Float)
	f.SetString(wei.String())
	return new(big.Float).Quo(f, big.NewFloat(1e18))
}
