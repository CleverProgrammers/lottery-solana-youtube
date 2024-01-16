import { createContext, useContext, useMemo, useEffect, useState } from "react";
import {BN} from "@project-serum/anchor";
import { SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import {AUTHORIZED_ADDRESS_STRING} from "../utils/constants";
import ls from 'local-storage';


import {
 
  getLotteryAddress,
  getMasterAddress,
  getProgram,
  getTicketAddress,
  getTotalPrize,
} from "../utils/program";
import { confirmTx, mockWallet } from "../utils/helper";
import toast from "react-hot-toast";
import { PublicKey } from "@solana/web3.js";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [masterAddress, setMasterAddress] = useState();
  const [initialized, setInitialized] = useState(false);
  const [lotteryId, setLotteryId] = useState();
  const [lotteryPot, setLotteryPot] = useState()
  const [lottery, setLottery] = useState()
  const [lotteryAddress, setLotteryAddress] = useState()
  const [userWinningId, setUserWinningId] = useState(false)
  const [lotteryHistory, setLotteryHistory] = useState([])
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const program = useMemo(() => {
    if (connection) {
      return getProgram(connection, wallet ?? mockWallet());
    }
  }, [connection, wallet]);

  useEffect(() => {
    updateState();
  }, [program]); 
  
  useEffect(() => {
    if (!lottery) return
    getPot();
    getHistory();
  }, [lottery])
  const updateState = async () => {
    if (!program) return;
    try {
      if (!masterAddress) {
        const masterAddress = await getMasterAddress();
        console.log("Master Address:", masterAddress);
        setMasterAddress(masterAddress);
      }
      const master = await program.account.master.fetch(
        masterAddress ?? (await getMasterAddress())
      );
      console.log("Master:", master);
      setInitialized(true);
      setLotteryId(master.lastId);
      const lotteryAddress = await getLotteryAddress(master.lastId);
      console.log("Lottery Address:", lotteryAddress);
      setLotteryAddress(lotteryAddress);
      const lottery = await program.account.lottery.fetch(lotteryAddress);
      console.log("Lottery:", lottery);
      setLottery(lottery);
 
     if(!wallet?.publicKey) return;
       const userTickets = await program.account.ticket.all();
     
      console.log("User Tickets:", userTickets);
      if (!userTickets || !Array.isArray(userTickets)) {
        console.error("Invalid user tickets:", userTickets);
        return;
      }
      const userWin = userTickets.some((t) => t.account.id === lottery.winnerId);
     if (userWin) {
        console.log("THERE IS A USER WIN");
        setUserWinningId(lottery.winnerId);
  
      } else {
        setUserWinningId(null);

      }
   
  
} catch (err) {
  console.error(err.message);
}
};


  const getPot = async() =>{
    try {
      const pot = await getTotalPrize(lottery); // Assuming getTotalPrize is an asynchronous function
      // Assuming pot is a decimal value representing the total prize in SOL
  
      // Convert the pot value to a floating-point number
      const potFloat = parseFloat(pot);
  
      // Format the pot value with one decimal place
      const formattedPot = potFloat.toFixed(1);
  
      // Update the state with the formatted decimal value
      setLotteryPot(formattedPot);
  
      // Display the formatted lottery pot
      console.log(`Lottery Pot: ${formattedPot} SOL`);
    } catch (err) {
      console.error(err.message);
      // Handle the error as needed
    }
  };
 
  const getHistory = async() => {
    if(!lotteryId) return

    const history = []

    for (const i in new Array(lotteryId).fill(null)){
      const id = lotteryId - parseInt(i)
      if(!id) break

      const lotteryAddress = await getLotteryAddress(id)
      const lottery = await program.account.lottery.fetch(lotteryAddress);
      const winnerId = lottery.winnerId;
      if(!winnerId) continue;
      const ticketAddress = await getTicketAddress(lotteryAddress, winnerId)
      const ticket = await program.account.ticket.fetch(ticketAddress)

      history.push({
        lotteryId: id,
        winnerId,
        winnerAddress: ticket.authority,
        prize: getTotalPrize(lottery),

      })
    }

    setLotteryHistory(history)
  }
  
  //CALL SOLANA PROGRAM INSTRUCTION
  const initMaster = async () => {
    try {
      // Assuming systemProgram is part of your imports
      const txHash = await program.methods
        .initMaster()
        .accounts({
          master: masterAddress,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId, // Fix this line
        })
        .rpc();
      await confirmTx(txHash, connection);
      updateState();
      toast.success("Initialized Master");
    } catch (err) {
      console.error(err.message);
      toast.error(err.message);
    }
  };

  const createLottery = async () => {
     try {
      // Replace 'YOUR_AUTHORIZED_ADDRESS' with the specific authorized address
      const authorizedAddress = new PublicKey(AUTHORIZED_ADDRESS_STRING);
      console.log("Wallet Public Key:", wallet?.publicKey?.toBase58());
      console.log("Authorized Address:", authorizedAddress.toBase58());
      if (!wallet?.publicKey) return;
     
      // Check if the current wallet's public key matches the authorized address
      if (!wallet?.publicKey.equals(authorizedAddress)) {
        throw new Error('Unauthorized to create lottery');
      }
      const startTimestamp = Math.floor(new Date().getTime() / 1000);
      const durationInMinutes = 2; // Set the duration in minutes
      const endTimestamp = startTimestamp + (durationInMinutes * 60); // Convert minutes to seconds
      const lotteryAddress = await getLotteryAddress(lotteryId + 1);
      const ticketPrice = new BN(LAMPORTS_PER_SOL / 10);
      const txHash = await program.methods
        .createLottery(ticketPrice)
        .accounts({
          lottery: lotteryAddress,
          master: masterAddress,
          startTime: startTimestamp,
          endTime: endTimestamp,  // Set the end time here
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      await confirmTx(txHash, connection);
  
      // Update the context with the new start and end times
      setStartTime(new Date(startTimestamp * 1000));
      setEndTime(new Date(endTimestamp * 1000));
      console.log("New Start Time:", new Date(startTimestamp * 1000));
      console.log("New End Time:", new Date(endTimestamp * 1000));
          // Check if localStorage is available before using it
       // Save start and end times to local storage
       ls.set("startTime", startTimestamp * 1000);
       ls.set("endTime", endTimestamp * 1000);
      updateState();
      toast.success("Lottery Created!");
    } catch (err) {
      console.error(err.message);
      toast.error(err.message);
    }
  };
  const endLottery = async () => {
    try {
      await pickWinner();
      toast.success("Lottery Ended!");
    } catch (err) {
      toast.error(err.message);
    }
  };
  const buyTicket = async() => {
    try{
      const txHash = await program.methods
      .buyTicket(lotteryId)
      .accounts({
        lottery: lotteryAddress,
        ticket: await getTicketAddress(
                    lotteryAddress,
                    lottery.lastTicketId + 1),
        buyer: wallet.publicKey, 
        systemProgram: SystemProgram.programId,
      })
      .rpc();
      await confirmTx(txHash, connection)
      updateState();
      toast.success("Bought a Ticket!!")
    }catch(err) {
      toast.error(err.message)

    }
  }
  const pickWinner = async() =>{
    try{
      const txHash = await program.methods
      .pickWinner(lotteryId)
      .accounts({
        lottery: lotteryAddress,
        authority: wallet.publicKey,
      })
      .rpc();
      await confirmTx(txHash, connection)

      updateState();
      toast.success("Pick a Winner!")
    } catch (err){
      toast.error(err.message)
    }
  }
  const claimPrize = async () => {
    try {
      const prize = await getTotalPrize(lottery);
      const feeAmount = (prize * 0.25).toFixed(9);  // Convert to SOL
      const actualFeeAmount = parseFloat(feeAmount) * LAMPORTS_PER_SOL;  // Convert to lamports
      const txHash = await program.methods
      .claimPrize(lotteryId, userWinningId)
      .accounts({
        lottery: lotteryAddress,
        ticket: await getTicketAddress(lotteryAddress, userWinningId),
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId, 
      })
      .rpc();
    await confirmTx(txHash, connection);
    updateState();
    toast.success("Claimed the prize!");
  } catch (err) {
    toast.error(err.message);
  }
};
const claimFee = async () => {
  try {
    // Replace 'YOUR_AUTHORIZED_ADDRESS' with the specific authorized address
    const authorizedAddress = new PublicKey(AUTHORIZED_ADDRESS_STRING);
    console.log("Wallet Public Key:", wallet?.publicKey?.toBase58());
    console.log("Authorized Address:", authorizedAddress.toBase58());
    if (!wallet?.publicKey) return;

    // Check if the current wallet's public key matches the authorized address
    if (!wallet?.publicKey.equals(authorizedAddress)) {
      throw new Error('Unauthorized to claim fee');
    }
      
    const prize = await getTotalPrize(lottery);
    const feeAmount = (prize * 0.25).toFixed(9);  // Convert to SOL
    const actualFeeAmount = parseFloat(feeAmount) * LAMPORTS_PER_SOL;  // Convert to lamports
      const txHash = await program.methods
          .claimFee(lotteryId) // Adjust the method name if different
          .accounts({
              lottery: lotteryAddress,
              ticket: await getTicketAddress(lotteryAddress),
              master:masterAddress,
              authority: wallet.publicKey,
              systemProgram: SystemProgram.programId,
              authorityAccount: new PublicKey(AUTHORIZED_ADDRESS_STRING), // Specifying the authority account for the fee
              
          })
          .rpc();
      await confirmTx(txHash, connection);
      updateState();
      toast.success("Claimed the fee!");
  } catch (err) {
      toast.error(err.message);
  }
};

return (
  <AppContext.Provider
    value={{
      connected: !!wallet?.publicKey,
      isMasterInitialized: initialized,
      lotteryId,
      lotteryPot,
      isLotteryAuthority: wallet && lottery && wallet.publicKey.equals(lottery.authority),
      isFinished: lottery && lottery.winnerId && !lottery.claimed,
      canClaim: lottery && !lottery.claimed && userWinningId ,
      lotteryHistory,
      startTime,
      endTime,
      setEndTime,
      setStartTime,
      initMaster,
      createLottery,
      buyTicket,
     pickWinner,
     claimPrize,
     claimFee,
     endLottery
    }}
  >
    {children}
  </AppContext.Provider>
);
};


export const useAppContext = () => {
return useContext(AppContext);
};
