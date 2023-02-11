import { useEffect, useState } from "react";
import Container from "@mui/material/Container";
import Game from "./Game";
import InitGame from "./InitGame";
import CustomDialog from "./components/CustomDialog";
import socket from "./socket";
import { TextField } from "@mui/material";

export default function App() {
  const [room, setRoom] = useState("");
  const [orientation, setOrientation] = useState("");
  const [username, setUsername] = useState("");
  const [players, setPlayers] = useState([]);
  const [usernameGiven, setUsernameGiven] = useState(false);

  useEffect(() => {
    // const username = prompt("Username");
    // setUsername(username);
    // socket.emit("username", username);

    socket.on("opponentJoined", (players) => {
      console.log("players", players);
      setPlayers(players);
    });
  }, []);

  return (
    <Container>
      <CustomDialog
        open={!usernameGiven}
        handleClose={() => setUsernameGiven(true)}
        title="Pick a username"
        contentText="Please select a username"
        handleContinue={() => {
          if (!username) return;
          socket.emit("username", username);
          setUsernameGiven(true);
        }}
      >
        <TextField
          autoFocus
          margin="dense"
          id="username"
          label="Username"
          name="username"
          value={username}
          required
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          fullWidth
          variant="standard"
        />
      </CustomDialog>
      {room ? (
        <Game
          room={room}
          orientation={orientation}
          username={username}
          players={players}
        />
      ) : (
        <InitGame
          room={room}
          setRoom={setRoom}
          setOrientation={setOrientation}
          setPlayers={setPlayers}
        />
      )}
    </Container>
  );
}
