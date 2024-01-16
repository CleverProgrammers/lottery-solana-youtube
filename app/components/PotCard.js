import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import style from "../styles/PotCard.module.css";
import { useAppContext } from "../context/context";
import { shortenPk } from "../utils/helper";
import { Toaster } from 'react-hot-toast';

const PotCard = () => {
  const {
    connected,
    isMasterInitialized,
    lotteryId,
    lotteryPot,
    isLotteryAuthority,
    isFinished,
    canClaim,
    initMaster,
    createLottery,
    buyTicket,
    pickWinner,
    claimPrize,
    claimFee,
  } = useAppContext();

 if (!isMasterInitialized)
    return (
      <div className={style.wrapper}>
        <div className={style.title}>
          Lottery <span className={style.textAccent}>#{lotteryId}</span>
        </div>
        {connected ? (
          <>
            <div className={style.btn} onClick={initMaster}>
              Initialize master
            </div>
          </>
        ) : (
          // Wallet multibutton goes here
          <WalletMultiButton />)}
      </div>
    );

  return (
    <div className={style.wrapper}>
      <Toaster />
      <div className={style.title}>
        Lottery <span className={style.textAccent}>#{lotteryId}</span>
      </div>
      <div className={style.pot}><strong>Pot 🍯:</strong> {lotteryPot} SOL</div>
      {connected ? (
        <>
          {!isFinished && (
            <div className={style.btn} onClick={buyTicket}>
              Enter
            </div>
          )}

          {isLotteryAuthority && !isFinished && (
            <div className={style.btn} onClick={pickWinner}>
              Pick Winner
            </div>
          )}
 {canClaim && (
            <div className={style.btn} onClick={claimPrize}>
              Claim prize
            </div>
          )}
          {canClaim && (
          <div className={style.btn} onClick={claimFee}>
                Claim fee
            </div>
               )}
          <div className={style.btn} onClick={createLottery}>
            Create lottery
          </div>
        </>
      ) : (
        <WalletMultiButton />)}   
    </div>
  );
};

export default PotCard;
