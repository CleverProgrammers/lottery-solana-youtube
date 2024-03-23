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
  const [lotteryId, setLotteryId] = useState()
  const [lotteryPot, setLotteryPot] = useState()
  const [lottery, setLottery] = useState()
  const [lotteryAddress, setLotteryAddress] = useState()

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

  useEffect(() => {
    if (!lottery) return
    getPot();
  }, [lottery])

  const updateState = async () => {
    if(!program) return;

    try {
      if(!masterAddress){
        // get master address
        const masterAddress = await getMasterAddress()
        // how to de save master address => using useState
        setMasterAddress(masterAddress)
      }
      // fetching the master object
      const master = await program.account.master.fetch(
        masterAddress ?? (await getMasterAddress())
      )
      // console.log(master)
      setInitialized(true)
      setLotteryId(master.lastId)
      const lotteryAddress = await getLotteryAddress(master.lastId)  // hold the PDA
      setLotteryAddress(lotteryAddress)
      const lottery = await program.account.lottery.fetch(lotteryAddress)
      setLottery(lottery)
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
      toast.success("Initialized Master!")

    } catch (err) {
      console.log(err.message)
      toast.error(err.message)
    }
  }

  const createLottery = async() => {
    try {
      const lotteryAddress = await getLotteryAddress(lotteryId + 1)  // hold the PDA
      const txHash = await program.methods
      .createLottery(new BN(1).mul(new BN(LAMPORTS_PER_SOL)))
      .accounts({
        lottery: lotteryAddress,
        master: masterAddress,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc()
      await confirmTx(txHash, connection);
      updateState()
      toast.success("Lottery Created!")
    } catch (err) {
      console.log(err.message)
      toast.error(err.message)
    }
  }

  const getPot = async() => {
    const pot = getTotalPrize(lottery)
    setLotteryPot(pot)
  }

  const buyTicket = async() => {
    try {
      // Ensure lottery is defined before proceeding
      if (!lottery) {
        console.log("Lottery is not yet initialized");
        return;
      }
  
      const txHash = await program.methods
      .buyTicket(lotteryId)
      .accounts({
        lottery: lotteryAddress,
        ticket: await getTicketAddress(
          lotteryAddress,
          lottery.lastTicketId + 1,
        ),
        buyer: wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .rpc()
      await confirmTx(txHash, connection)
      updateState()
      toast.success("Bought a Ticket!")
    }
    catch(err) {
      console.log(err.message)
      toast.error(err.message)
    }
  }

  const pickWinner = async() => {
    try {
      const txHash = await program.methods
      .pickWinner(lotteryId)
      .accounts({
        lottery: lotteryAddress,
        authority: wallet.publicKey
      })
      .rpc();
      
    }
    catch(err) {
      console.log(err.message)
      toast.error(err.message)
    }
  }

  return (
    <AppContext.Provider
      value={{
        // Put functions/variables you want to bring out of context to App in here
        connected: wallet?.publicKey ? true : false,
        isMasterInitialized: initialized,
        lotteryId,
        lotteryPot,
        isLotteryAuthority: wallet && lottery && wallet.publicKey.equals(lottery.authority),
        initMaster,
        createLottery,
        buyTicket,
        lottery
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};
