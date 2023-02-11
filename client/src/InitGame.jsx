import { Button, Stack, TextField } from "@mui/material";
import { useState } from "react";
import CustomDialog from "./components/CustomDialog";
import socket from "./socket";

export default function InitGame({ setRoom, setOrientation, setPlayers }) {
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomInput, setRoomInput] = useState(''); // input state
  const [roomError, setRoomError] = useState('');
  return (
    <Stack
      justifyContent="center"
      alignItems="center"
      sx={{ py: 1, height: "100vh" }}
    >
      <CustomDialog
        open={roomDialogOpen}
        handleClose={() => setRoomDialogOpen(false)}
        title="Select Room to Join"
        contentText="Enter a valid room ID to join the room"
        handleContinue={() => {
          if (!roomInput) return;
          socket.emit("joinRoom", { roomId: roomInput }, (r) => {
            console.log('callback response', r, roomInput);
            if (r.error) return setRoomError(r.message);
            setRoom(r.roomId);
            setPlayers(r?.players);
            setOrientation("black");
            setRoomDialogOpen(false);
          });
        }}
      >
        <TextField
          autoFocus
          margin="dense"
          id="room"
          label="Room ID"
          name="room"
          value={roomInput}
          required
          onChange={(e) => setRoomInput(e.target.value)}
          type="text"
          fullWidth
          variant="standard"
          error={Boolean(roomError)}
          helperText={!roomError ? 'Enter a room ID' : `Invalid room ID: ${roomError}` }
        />
      </CustomDialog>
      <Button
        variant="contained"
        onClick={() => {
          socket.emit("createRoom", (r) => {
            console.log(r);
            setRoom(r);
            setOrientation("white");
          });
        }}
      >
        Start a game
      </Button>
      <Button
        onClick={() => {
          setRoomDialogOpen(true)
        }}
      >
        Join a game
      </Button>
    </Stack>
  );
}
