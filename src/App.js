import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';

export default function App() {

     /*
  * Just a state variable we use to store our user's public wallet.
  */
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [myWaves, setmyWaves] = useState([]);
  const [mining, setmining] = useState(false);
  const [waveField, setwaveField] = useState("");


  // I got this Address after this command npx hardhat run scripts/deploy.js --network rinkeby
  // It's the address of my SmartContract
  const contractAddress = "0x58A7156695AcEbcD3ee3409d412bA4600A083636";

  // I've copied in ./utils/WavePortal.json the file it's been generated
  // in the project of the smart contract after compiling in directory 
  // /artifats/contracts/WabePortal.sol/WabPortal.json
   const contractABI = abi.abi;

  const handleChange = (event) => {    
    setwaveField(event.target.value);    
  }

  const handleSubmit = (event) =>  {    
    event.preventDefault();
    wave(waveField, currentAccount)
  }

  const get_AllWaves = async (_currentAccount) => {
    try {

      const { ethereum } = window;
      
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();        

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
            prized: wave.prize
          });
        });    

        //console.log(wavesCleaned)

      if (currentAccount)
      {
       const filteredwaves = wavesCleaned.filter(wave => 
       
           (wave.address.toString().toUpperCase() ===
           currentAccount.toString().toUpperCase())               
           
        );  
        setmyWaves(filteredwaves)
       console.log(filteredwaves)          
      }         

  

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async (_wave) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(_wave, {gasLimit: 300000});
        setmining(true)
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        setmining(false)

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber()); 

        get_AllWaves();


      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
}
  
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      
      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length !== 0) {
        const account = accounts[0];

        //console.log('currentAccount', account)
        //console.log("Found an authorized account:", account);

                      
        setCurrentAccount(account)

        //console.log('Tmp', State)   

      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

    /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }

    /*
  * This runs our function when the page loads.
  */
  useEffect(() => {
    checkIfWalletIsConnected();    

  let wavePortalContract;

  const onNewWave = (from, timestamp, message, prize) => {
    console.log('NewWave', from, timestamp, message);
    setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
        prized: prize
      },
    ]);
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    wavePortalContract.on('NewWave', onNewWave);
  }

  return () => {
    if (wavePortalContract) {
      wavePortalContract.off('NewWave', onNewWave);
    }
  };    

  }, [])

    useEffect(() => {
    
    get_AllWaves(currentAccount);
    //console.log(currentAccount)
  }, [currentAccount])
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        <span>👋</span>Hey there!
        </div>
    
      
        {
          (allWaves !==0) && (
            <div className = "bio">
            We've got {allWaves.length} waves and {myWaves.length} are yours

            </div>
          )
        }


        {
          (mining) && (


          <div className="progress"> 
            <div className="progress__bar"> Wave is being mined </div>
            </div>


          )
        }        


      { currentAccount  && (!mining) &&  (
        
      <form onSubmit={handleSubmit}>
          <input type="text" onChange={handleChange} /> 
        <input type="submit" value="Wave at me" />
      </form>
      )
      }

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}


        {
          allWaves.map((wave, index) => 
          {
            return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
              <div>Prized : {wave.prized.toString()}</div>
            </div>)            

          })
        }
       

      </div>
    </div>
  );
}
