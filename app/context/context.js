import { createContext, useContext, useMemo, useEffect, useState } from "react";
import { BN } from "@project-serum/anchor";
import { SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { bs58 } from "bs58";;

import { getLotteryAddress, getMasterAddress, getProgram, getTicketAddress, getTotalPrize } from "../utils/program";
import { confirmTx, mockWallet } from "../utils/helper";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

  const [masterAddress, setMasterAddress] = useState();
  const [initialized, setInitialized] = useState(false);

  // Get Provider
  const { connection } = useConnection()
  const wallet = useAnchorWallet()                        
  const program = useMemo(() => {
    if(connection) {
      return getProgram(connection, wallet ?? mockWallet());
    }
  }, [connection, wallet])

  // react hook what do we want to do when the component is loading
  useEffect(() => {
    updateState()                               
  }, [program] )   // array is called dependency module

  const updateState = async () => {
    if(!program) return;

    try {
      if(!masterAddress){
        // get master address
        const masterAddress = await getMasterAddress()
        // how to de save master address => using useState
        setMasterAddress(masterAddress)
        console.log(masterAddress)
      }
      // fetching the master object
      const master = await program.account.master.fetch(
        masterAddress ?? (await getMasterAddress())
      )
      console.log(master)
      setInitialized(true)
    } catch(err) {
      console.log(err.message)      
    }
  }

  // Call Solana program instructions

  const initMaster = async() => {
    try {
      const txHash = await program.methods
      .initMaster()
      .accounts({
        master: masterAddress,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .rpc()
      await confirmTx(txHash, connection)

      updateState()

    } catch (err) {
      console.log(err.message)
    }
  }

  return (
    <AppContext.Provider
      value={{
        // Put functions/variables you want to bring out of context to App in here
        connected: wallet?.publicKey ? true : false,
        isMasterInitialized: initialized,
        initMaster,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
