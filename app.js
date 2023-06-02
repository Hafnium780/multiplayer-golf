const { Server } = require("socket.io");
const express = require("express");
const http = require('http');
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8080;
const io = new Server(server);

app.get("/", (req, res) => res.sendFile(__dirname + "/client.html"));

io.on("connection", (s) => {
  console.log("a");
});

server.listen(port, () => console.log(`Listening on port ${port}!`));
