import Header from "../components/Header";
import PotCard from "../components/PotCard";
import Table from "../components/Table";
import style from "../styles/Home.module.css";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
require("@solana/wallet-adapter-react-ui/styles.css");

export default function Home() {
  const endpoint = "https://wandering-virulent-thunder.solana-testnet.discover.quiknode.pro/9e963410afb43de9dadd6765217948638bb0adcb/"

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  )

  return (
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoconnect>
           <WalletModalProvider>
           <div className={style.wrapper}>
           <Header />
           <PotCard />
           <Table />
           </div>
          </WalletModalProvider>
         </WalletProvider>
        </ConnectionProvider>

  );
}
