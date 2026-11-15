import { Cotton } from "./cotton";
import { Fleece } from "./fleece";
import { Merino } from "./merino";

// CARAL BOARD: storyboard previo de las piezas tech CARAL (merino, polar, algodón peinado). Un panel por beat del loop 0–6s.
const PIECES = { merino: Merino, fleece: Fleece, cotton: Cotton };
export type CaralPiece = keyof typeof PIECES;

export const CaralBoard = ({ piece, beat }: { piece: CaralPiece; beat: 0 | 1 | 2 }) => {
  const Board = PIECES[piece];
  return <Board beat={beat} />;
};
