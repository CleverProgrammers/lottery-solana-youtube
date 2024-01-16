import Header from "../components/Header";
import PotCard from "../components/PotCard";
import Table from "../components/Table";
import style from "../styles/Home.module.css";


import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { AppProvider } from "../context/context";
require("@solana/wallet-adapter-react-ui/styles.css"); 

export default function Home() {
  

  const endpoint = "https://solana-devnet.g.alchemy.com/v2/K1FLwvwRR4qqenmH47kscxBO-xmcoQZl"

  const wallets = useMemo(
    () => [
    new PhantomWalletAdapter(),
  ],[]
  )
  
  return (
  
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <AppProvider>
              <div className={style.wrapper}>
                <Header />
                <PotCard />
                <Table />
              </div>
            </AppProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
   
  );
}