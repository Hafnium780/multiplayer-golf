const { Server } = require("socket.io");
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8000;
const io = new Server(server);

app.get("/", (req, res) => res.sendFile(__dirname + "/client/index.html"));
app.get("/script.js", (req, res) =>
	res.sendFile(__dirname + "/client/script.js")
);

const { Map } = require("./map.js");
const { Player } = require("./player.js");

const players = {};
const sockets = {};
const map = new Map(0, 0, 100, 200);

map.addWall(-50, -50, -50, 200);
map.addWall(-50, 200, 0, 250);
map.addWall(0, 250, 150, 300);
map.addWall(150, 300, 150, 150);
map.addWall(150, 150, 50, 20);
map.addWall(50, 20, 50, -20);
map.addWall(50, -20, -50, -50);

const maxShootPower = 2000;

setInterval(() => {
	const playerData = {};
	for (const id of Object.keys(players)) {
		// 1/120
		players[id].update(0.00833, map.walls, map.goalHole);
		playerData[id] = { x: players[id].x, y: players[id].y };
	}
	for (const id of Object.keys(sockets)) {
		sockets[id].emit("updatePlayers", playerData);
	}
}, 8.33); // 1000/120

setInterval(() => {
	console.log(`Currently ${Object.keys(sockets).length} user(s) connected`);
}, 10000);

io.on("connection", (socket) => {
	console.log(`Connected: ${socket.id} from ip ${socket.handshake.address}`);

	players[socket.id] = new Player(0, 0);
	sockets[socket.id] = socket;
	socket.emit("updateMap", map);
	socket.emit("socketId", socket.id);

	socket.on("disconnect", () => {
		delete players[socket.id];
		delete sockets[socket.id];
		console.log(`Disconnected: ${socket.id}`);
	});

	socket.on("shoot", (v) => {
		console.log(`${socket.id}: Shot with power ${v.power}`);
		if (v.power > maxShootPower) {
			players[socket.id].vx = maxShootPower * Math.cos(v.angle);
			players[socket.id].vy = maxShootPower * Math.sin(v.angle);
		} else {
			players[socket.id].vx = v.power * Math.cos(v.angle);
			players[socket.id].vy = v.power * Math.sin(v.angle);
		}
	});
});

server.listen(port, () => console.log(`Listening on port ${port}!`));
