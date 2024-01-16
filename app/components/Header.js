import { useEffect } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAppContext } from "../context/context";
import style from "../styles/Header.module.css";

const Header = () => {
  const { lottery, startTime, endTime, setStartTime, setEndTime } = useAppContext();

  // Load start and end times from localStorage on component mount
  useEffect(() => {
    const storedStartTime = localStorage.getItem("startTime");
    const storedEndTime = localStorage.getItem("endTime");

    if (storedStartTime && storedEndTime) {
      setStartTime(new Date(parseInt(storedStartTime)));
      setEndTime(new Date(parseInt(storedEndTime)));
    }
  }, [setStartTime, setEndTime]);
  // Check if lottery is available
  if (!lottery) {
    return (
      <div className={style.wrapper}>
        <div className={style.title}>Lottery DAPP 💰</div>
        {startTime && <div>Start Time: {startTime.toLocaleString()}</div>}
        {endTime && <div>End Time: {endTime.toLocaleString()}</div>}
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className={style.wrapper}>
      <div className={style.title}>Lottery DAPP 💰</div>
      <div>Start Time: {startTime}</div>
      <div>End Time: {endTime}</div>
    </div>
  );
};

export default Header;
