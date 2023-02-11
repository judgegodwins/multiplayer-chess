import { io } from "socket.io-client";

const socket = io('localhost:8080');

export default socket;