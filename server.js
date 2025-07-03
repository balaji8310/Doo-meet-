const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", socket => {
  if (waitingUser) {
    socket.emit("peer", waitingUser.id);
    waitingUser.emit("peer", socket.id);
    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  socket.on("signal", data => {
    io.to(data.to).emit("signal", {
      from: socket.id,
      signal: data.signal,
    });
  });

  socket.on("disconnect", () => {
    if (waitingUser === socket) waitingUser = null;
  });
});

server.listen(3000, () => console.log("TOOMEET running at http://localhost:3000"));