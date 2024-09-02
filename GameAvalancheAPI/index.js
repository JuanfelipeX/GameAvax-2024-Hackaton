const express = require("express");
const { Web3 } = require("web3");
const bodyParser = require("body-parser");
const erc721ABI = require("./erc721ABI.json"); // Importa el ABI desde el archivo

// Configura el servidor
const app = express();
app.use(bodyParser.json());


// Configuración de Web3 con el RPC de la testnet de Fuji de Avalanche
const web3 = new Web3(
    "https://fuzzy-giggle-6wqq95xgwgj2r566-9650.app.github.dev/ext/bc/Avamerald/rpc",
); // URL del RPC de AvaxMerald

// Endpoint para conectar la wallet de MetaMask
app.post("/api/sendTransaction", async (req, res) => {
    try {
        const { fromAddress, toAddress, amount, privateKey } = req.body;

        // Verifica que todos los datos necesarios estén presentes
        if (!fromAddress || !toAddress || !amount || !privateKey) {
            return res.status(400).json({
                error: "Missing required parameters",
            });
        }

        // Crear una transacción
        const tx = {
            from: fromAddress,
            to: toAddress,
            value: web3.utils.toWei(amount, "ether"), // Convertir la cantidad a Wei
            gas: 22000,
            gasPrice: web3.utils.toWei("0.00001", "ether"), // Gas price en Wei
        };

        // Firmar la transacción
        const signedTx = await web3.eth.accounts.signTransaction(
            tx,
            privateKey,
        );

        // Enviar la transacción
        const receipt = await web3.eth.sendSignedTransaction(
            signedTx.rawTransaction,
        );

        res.status(200).json({
            message: "Transaction successful",
            transactionHash: receipt.transactionHash,
        });
    } catch (error) {
        // Proporcionar más detalles sobre el error
        console.error("Transaction error:", error);
        res.status(500).json({
            error: "Transaction failed",
            details: error.message,
        });
    }
});

// Dirección del contrato ERC-721
const erc721ContractAddress = "0x11D8DAFbbCbaCD957984CCEE06269724ca66fA94"; // Reemplaza con tu dirección del contrato
const erc721Contract = new web3.eth.Contract(erc721ABI, erc721ContractAddress);

// Endpoint para acuñar (mint) un NFT cuando el jugador recolecta un objeto (imagen)
app.post("/api/mintNFT", async (req, res) => {
    try {
        const { playerAddress, tokenURI, privateKey } = req.body;

        // Verifica que todos los datos necesarios estén presentes
        if (!playerAddress || !tokenURI || !privateKey) {
            return res.status(400).json({
                error: "Missing required parameters",
            });
        }

        // Crear la transacción para acuñar el NFT
        const account = web3.eth.accounts.wallet.add(privateKey);

        const _erc721Contract = new web3.eth.Contract(
            erc721ABI,
            erc721ContractAddress,
        );
        console.log("hola: ", account[0].address);
        const receipt = await _erc721Contract.methods
            .safeMint(playerAddress, tokenURI)
            .send({ from: account[0].address });
        // Enviar la transacción

        res.status(200).json({
            message: "NFT minted successfully",
            transactionHash: receipt.transactionHash,
        });
    } catch (error) {
        // Proporcionar más detalles sobre el error
        console.error("Minting NFT error:", error);
        res.status(500).json({
            error: "Minting NFT failed",
            details: error.message,
        });
    }
});

// Inicia el servidor en el puerto 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
