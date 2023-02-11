import "./App.css";
import { Chessboard } from "react-chessboard";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Chess } from "chess.js";
import socket from "./socket";
import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import CustomDialog from "./components/CustomDialog";

function Game({ players, username, room, orientation }) {
  const game = useMemo(() => new Chess(), []);
  const [fen, setFen] = useState(game.fen());
  const [over, setOver] = useState("");

  console.log("orientation", orientation);

  const makeAMove = useCallback(
    function makeAMove(move) {
      try {
        const result = game.move(move);
        setFen(game.fen());

        console.log("over, checkmate", game.isGameOver(), game.isCheckmate());

        if (game.isGameOver()) {
          if (game.isCheckmate()) {
            console.log("checkmate", game.turn());
            setOver(
              `Checkmate! ${game.turn() === "w" ? "black" : "white"} wins!`
            );
          } else if (game.isDraw()) {
            setOver("Draw");
          } else {
            setOver("Game over");
          }
        }

        return result;
      } catch (e) {
        return null;
      } // null if the move was illegal, the move object if the move was legal
    },
    [game]
  );

  // useEffect(() => {
  //   console.log('game effecting');
  //   setTimeout(() => {
  //     game.load('rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 1 3');
  //     setFen(game.fen())

  //     console.log('checkmate:', game.isCheckmate());
  //     console.log('loser', game.turn());

  //     if (game.isGameOver()) {
  //       if (game.isCheckmate()) {
  //         console.log('checkmate', game.turn())
  //         setOver(`Checkmate! ${game.turn() === 'w' ? 'black' : 'white'} wins!`);
  //       } else if (game.isDraw()) {
  //         setOver("Draw");
  //       } else {
  //         setOver("Game over");
  //       }
  //     }
  //   }, 20000);
  // }, [game]);

  useEffect(() => {
    socket.on("move", (move) => {
      console.log("move came", move);
      makeAMove(move);
    });
  }, [makeAMove]);

  // function makeRandomMove() {
  //   const possiblegame.moves();
  //   console.log(game.isGameOver);

  //   if (game.isGameOver() || game.isDraw() || possibleMoves.length === 0)
  //     return; // exit if the game is over
  //   const randomIndex = Math.floor(Math.random() * possibleMoves.length);

  //   makeAMove(possibleMoves[randomIndex]);
  // }

  function onDrop(sourceSquare, targetSquare) {
    // orientation is either 'white' or 'black'. game.turn() returns 'w' or 'b'
    console.log("turn", game.turn(), orientation[0]);
    if (game.turn() !== orientation[0]) return null; // prohibit player from moving piece of other player
    
    const moveData = {
      from: sourceSquare,
      to: targetSquare,
      color: game.turn(),
      promotion: "q",
    };

    const move = makeAMove(moveData);

    // illegal move
    if (move === null) return false;

    socket.emit("move", {
      move,
      room,
    });

    // setTimeout(makeRandomMove, 200);
    return true;
  }

  console.log("OVER", over);

  return (
    <Stack>
      <Card>
        <CardContent>
          <Typography variant="h5">Room ID: {room}</Typography>
        </CardContent>
      </Card>
      <Stack flexDirection="row" sx={{ pt: 2 }}>
        <div className="board">
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardOrientation={orientation}
          />
        </div>
        {players.length > 0 && (
          <Box>
            <List>
              <ListSubheader>Players</ListSubheader>
              {players.map((p) => (
                <ListItem key={p}>
                  <ListItemText primary={p} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Stack>
      <CustomDialog
        open={Boolean(over)}
        title={over}
        contentText={over}
        handleContinue={() => {
          setOver("");
        }}
      />
    </Stack>
  );
}

export default Game;
