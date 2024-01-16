
import { AnchorProvider, BN, Program } from "@project-serum/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

import IDL from "./idl.json";
import {
  LOTTERY_SEED,
  MASTER_SEED,
  PROGRAM_ID,
  TICKET_SEED,

} from "./constants";

// How to fetch our Program
export const getProgram = (connection, wallet) => {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(IDL, PROGRAM_ID, provider);
  return program;
};

export const getMasterAddress = async () => {
  return (
    await PublicKey.findProgramAddressSync([Buffer.from(MASTER_SEED)], PROGRAM_ID)
  )[0];
};

export const getLotteryAddress = async (id) => {
  return (
    await PublicKey.findProgramAddressSync(
      [Buffer.from(LOTTERY_SEED), new BN(id).toArrayLike(Buffer, "le", 4)],
      PROGRAM_ID
    )
  )[0];
};

export const getTicketAddress = async (lotteryPk, id) => {
  return (
    await PublicKey.findProgramAddressSync(
      [
        Buffer.from(TICKET_SEED),
                lotteryPk.toBuffer(),
        new BN(id).toArrayLike(Buffer, "le", 4),
      ],
      PROGRAM_ID
    )
  )[0];
    };

// Return the lastTicket ID and multiply the ticket price and convert LAMPORTS PER SOL and convert it to String
export const getTotalPrize = (lottery) => {
  if (!lottery || lottery.lastTicketId === 0 || !lottery.ticketPrice) {
    // Return default value when there is missing or undefined data, or when no lottery is created
    return "0.0";
  }

  const totalTickets = new BN(lottery.lastTicketId);
  const ticketPriceInLamports = new BN(lottery.ticketPrice).mul(new BN(LAMPORTS_PER_SOL));

  // Calculate the total prize in SOL with one decimal place
  const totalPrizeInLamports = totalTickets.mul(ticketPriceInLamports);
  const totalPrizeInSOL = totalPrizeInLamports.div(new BN(LAMPORTS_PER_SOL));

  // Format the total prize with one decimal place as a string
  const formattedTotalPrize = (totalPrizeInSOL.toNumber() / 1e9).toFixed(1);

  console.log("Formatted Total Prize in SOL:", formattedTotalPrize);

  // Ensure the total prize is returned as a string
  return formattedTotalPrize.toString();
};




