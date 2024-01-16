import style from "../styles/TableRow.module.css";
import { shortenPk } from "../utils/helper";

const TableRow = ({
  lotteryId,
  winnerAddress,
  winnerId,
  prize,
}) => {
  return (
    <div className={style.wrapper}>
      <div>#{lotteryId}</div>
      <div>{shortenPk(winnerAddress)}</div>
      <div>#{winnerId}</div>
      <div>+{prize} SOL</div>
    </div>
  );
};

export default TableRow;
