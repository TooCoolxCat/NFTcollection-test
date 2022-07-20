import { useEffect, useRef, useState } from "react"
import styles from "../styles/Home.module.css";
import Head from "next/head";
import { providers, Contract ,utils} from "ethers";
import Web3Modal from "web3modal";
import { NFT_CONTRACT_ADDRESS,abi} from "../constants";

export default function Home() {

    //check: if user's wallet if connected or not
    const [walletConnected, setWalletConnected] = useState(false);
    //check: if presale has started or not
    const [presaleStarted, setPresaleStarted] = useState(false);
    //check if presale has ended or not
    const [presaleEnded, setPresaleEnded] = useState(false);
    //loading
    const [loading,setLoading] = useState(false);
    //check if the connected wallet is the owner or not
    const [isOwner, setIsOwner] = useState(false);
    //update minted tokenIds
    const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
    
    //keep wallet connected when page is running
    const web3ModalRef = useRef();

    //presaleMint: mint an nft during presale
    const presaleMint = async () => {
      try {
        //need a signer, since this is a "write" transaction
        const signer = await getProviderOrSigner(true);
        //create an instance of nft contract
        const whitelistContract = new Contract (
          abi,
          NFT_CONTRACT_ADDRESS,
          signer
        );
      // call the presaleMint from the contract, only whitelist addresses could mint
      const tx = await whitelistContract.presaleMint({
        //set the value of the nft
        //using utils library from ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      //wait for transaction to be mined
      await tx.wait();
      setLoading(false);
      //success message
      window.alert("You successfully minted a Crypto Dev!");
      } catch (err) {
        console.error(err);
      }
    };

    //publicMint: mint an nft during public sale
    const publicMint = async () => {
      try {
        //need a signer, since this is a "write" transaction
        const signer = await getProviderOrSigner(true);
        //create an instance of nft contract
        const whitelistContract = new Contract (
          NFT_CONTRACT_ADDRESS,
          abi,
          signer
        );
      // call the presaleMint from the contract, only whitelist addresses could mint
      const tx = await whitelistContract.mint({
        //set the value of the nft
        //using utils library from ethers.js
        value: utils.parseEther("0.03"),
      });
      setLoading(true);
      //wait for transaction to be mined
      await tx.wait();
      setLoading(false);
      //success message
      window.alert("You successfully minted a Crypto Dev!");
      } catch (err) {
        console.error(err);
      }
    };

    //connectWallet: connects the metamask wallet
    const connectWallet = async() => {
      try {
        //when use for the first time, prompts metamask
        await getProviderOrSigner();
        setWalletConnected(true);
      } catch (err) {
        console.error(err);
      }
    
    };
    
    
    //startPresale: starts the presale
    const startPresale = async () => {
      try {
        //need a signer here since it is a "write" transaction
        const signer = await getProviderOrSigner(true);
        //create a new instance of the Contract with a Signer
        const whitelistContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          abi,
          signer
        );
        const tx = await whitelistContract.startPresale();
        setLoading(true);
        //wait for the transaction
        await tx.wait();
        //set the presale started to be true
        await checkIfPresaleStarted();
        
      } catch (err) {
        console.error(err);
      }
    };

   
    const checkIfPresaleStarted = async () => {
      try {   
        const provider = await getProviderOrSigner();

        //get an instance of the nft contract
        const nftContract = new Contract (
          NFT_CONTRACT_ADDRESS,
          abi,
          provider
        );
        
        //call presaleStarted function from the contract
        const _presaleStarted = await nftContract.presaleStarted();
        
        if (!_presaleStarted){
          await getOwner();
        }
        setPresaleStarted(_presaleStarted);
        return _presaleStarted;
      } catch (err) {
        console.error(err);
        return false
      }
    };

    const checkIfPresaleEnded = async () => {
      try {
        
        const provider = await getProviderOrSigner();

        //get an instance of the nft contract
        const nftContract = new Contract (
          NFT_CONTRACT_ADDRESS,
          abi,
          provider
        );

        //return a bignumber because presaleEnded is uint256
        //return a timestamp in seconds
        const presaleEndTime = await nftContract.presaleEnded();

        const currentTimeInSeconds = Date.now() / 1000;
        const hasPresaleEnded = presaleEndTime.lt(
          Math.floor(currentTimeInSeconds));
        
        if (hasPresaleEnded){
          setPresaleEnded(true);
        } else{
          setPresaleEnded(false);
        }
        return hasPresaleEnded;

      } catch (err) {
        console.error(err);
        return false;
      }
    };
  
     //getOwner: call the contract to retrieve the owner
     const getOwner = async () => {
      try {
        const signer = await getProviderOrSigner(true);

        const nftContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          abi,
          signer
        ); 

        // Get the address associated to the signer which is connected to  MetaMask
        const _owner = await nftContract.owner();
        const userAddress = await signer.getAddress();

        if (userAddress.toLowerCase() === _owner.toLowerCase()) {
          setIsOwner(true);
        }
      } catch (err) {
        console.error(err.message);
      }
    };
   

    //getTokensMinted: get the number of tokenIds that have been minted
    const getTokensMinted = async () => {
      try {
      
        const provider = await getProviderOrSigner();
              //get an instance of the nft contract
        const nftContract = new Contract (
              NFT_CONTRACT_ADDRESS,
              abi,
              provider
              );
        const _tokenIds = await nftContract.tokenIds();
        setTokenIdsMinted(_tokenIds.toString());
      } catch (err) {
       console.error(err); 
      }
      
    }
    const getProviderOrSigner = async (needSigner = false) => {
          // need to gain access to provider/signer from metamask
          const provider = await web3ModalRef.current.connect();
          const web3Provider = new providers.Web3Provider(provider);
          //If user is not on the same network, change to goerli
          const {chainId} = await web3Provider.getNetwork();
          if (chainId !== 5){
            window.alert("Please switch to Goerli");
            throw new Error("Incorrect network");
          }
          if (needSigner) {
            const signer = web3Provider.getSigner();
            return signer;
          }

          return web3Provider;
    };
  
    //whever the value of walletConnected changes, this effect will be called
    useEffect(() => {
      if (!walletConnected){
        web3ModalRef.current = new Web3Modal({
          network:"goerli",
          providerOptions:{},
          disableInjectedProvider: false,
        });

        connectWallet();
        //check if presale has started and ended
        const _presaleStarted = checkIfPresaleStarted();
        if (_presaleStarted){
          checkIfPresaleEnded();
        }
       getTokensMinted();

    //set an interval which gets called every 5 secs
    const presaleEndedInterval = setInterval(async function() {
      const _presaleStarted = await checkIfPresaleStarted();

      if (_presaleStarted) {
        const _presaleEnded = await checkIfPresaleEnded();
        if (_presaleEnded){
          clearInterval(presaleEndedInterval);
        }
      }
    }, 5*1000);

  //set a n interval to check token ids minted every 5 secs
    setInterval( async function() {
      await getTokensMinted();
    }, 5*1000);
   }
    },[walletConnected]);

  //render button : returns a button based on the state of the dapp
  const renderButton = () => {
    if (!walletConnected){
      return (
        <button onClick = {connectWallet} className = {styles.button}>
          Connect wallet
        </button>
      );
    }

    if (loading) {
      return <button className = {styles.button}> Loading... </button> 
    }

    if (isOwner && !presaleStarted) {
      return (
        <button className = {styles.button} onClick = {startPresale}>
          Start Presale!
          </button>
      );
    }

    if (!presaleStarted){
      return (
        <div> 
          <div className={styles.description}>
            Presale hasn't started yet!
          </div>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div>
            <div className={styles.description}>
              Preasel has started, if you are on fashionlist, mint
            </div> 
            <button onClick={publicMint} className={styles.button}>
             Presale Mint
            </button>
        </div>
      );
    }

    
    if (presaleStarted && presaleEnded) {
      return (
       <button onClick={publicMint} className={styles.button}>
        public Mint
       </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Too Cool NFT</title>
      </Head>
      <div className = {styles.main}>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>

      <footer className={styles.footer}>
       Made with &#10084;
      </footer>
    </div>
  );
}
