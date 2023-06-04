// Canvas
let internalWidth,
	internalHeight,
	windowWidth,
	windowHeight,
	canvas = document.getElementById("mainCanvas"),
	ctx;

const canvasResolution = 1.5;

const resizeCanvas = () => {
	internalWidth = canvasResolution * window.innerWidth;
	internalHeight = canvasResolution * window.innerHeight;
	windowWidth = window.innerWidth;
	windowHeight = window.innerHeight;
	canvas.setAttribute("width", internalWidth);
	canvas.setAttribute("height", internalHeight);
	canvas.style.width = window.innerWidth + "px";
	canvas.style.height = window.innerHeight + "px";
	ctx = canvas.getContext("2d");
	ctx.translate(internalWidth / 2, internalHeight / 2);
};
resizeCanvas();

window.addEventListener("resize", resizeCanvas);

const fillCircle = (x, y, r) => {
	ctx.beginPath();
	ctx.arc(x, y, worldDimensionToScreen(r), 0, 2 * Math.PI);
	ctx.fill();
};

// Camera
let cameraX = 0,
	cameraY = 0,
	cameraZ = 2;

const worldToScreen = (x, y) => {
	return {
		x: (cameraZ * (x - cameraX)) / canvasResolution,
		y: (-cameraZ * (y - cameraY)) / canvasResolution,
	};
};

const screenToWorld = (x, y) => {
	return {
		x: (x / cameraZ) * canvasResolution + cameraX,
		y: (-y / cameraZ) * canvasResolution + cameraY,
	};
};

const windowToScreen = (x, y) => {
	return {
		x: (x - windowWidth / 2) * canvasResolution,
		y: (y - windowHeight / 2) * canvasResolution,
	};
};

const screenToWindow = (x, y) => {
	return {
		x: x / canvasResolution + windowWidth / 2,
		y: y / canvasResolution + windowHeight / 2,
	};
};

const windowToWorld = (x, y) => {
	const screen = windowToScreen(x, y);
	return screenToWorld(screen.x, screen.y);
};

const worldToWindow = (x, y) => {
	const screen = worldToScreen(x, y);
	return screenToWindow(screen.x, screen.y);
};

const worldDimensionToScreen = (d) => {
	return d * cameraZ;
};

// Mouse
let mouseX, mouseY;
const updateMousePosition = (e) => {
	mouseX = e.clientX;
	mouseY = e.clientY;
};

document.addEventListener("mousedown", (e) => {
	updateMousePosition(e);
});
document.addEventListener("mouseup", (e) => {
	updateMousePosition(e);
});
document.addEventListener("mousemove", (e) => {
	updateMousePosition(e);
});

document.addEventListener("click", (e) => {
	updateMousePosition(e);
	shoot();
});

document.addEventListener("wheel", (e) => {
	cameraZ = Math.max(Math.min(cameraZ * (1 - e.deltaY / 1000), 10), 0.95);
});

const maxPower = 4000; // Larger than server value to cap power a little bit away from edge of screen
const magnitudeToPower = (magnitude) => {
	// Magnitude of a window vector to the power of a shot
	const normalizedMagnitude =
		magnitude / Math.min(windowWidth / 2, windowHeight / 2); // Number from 0 to 2ish, capped server side anyway
	return maxPower * normalizedMagnitude ** 2;
};

const drawGuide = () => {
	if (!players || !socketId || !mouseX) return;
	const playerPosition = worldToWindow(
		players[socketId].x,
		players[socketId].y
	);

	// Vector from mouse to player
	const deltaX = playerPosition.x - mouseX;
	const deltaY = playerPosition.y - mouseY;

	const angle = Math.atan2(deltaY, deltaX);
	const magnitude = Math.sqrt(deltaX ** 2 + deltaY ** 2);

	const screenPower = worldDimensionToScreen(
		magnitudeToPower(magnitude) * 0.05
	); // Arbitrary scaling factor

	const powerDeltaX = screenPower * Math.cos(angle);
	const powerDeltaY = screenPower * Math.sin(angle);

	const playerScreenPosition = worldToScreen(
		players[socketId].x,
		players[socketId].y
	);

	// Split into dots
	ctx.fillStyle = "#FFF";
	for (let t = 0.1; t <= 1.01; t += 0.1) {
		fillCircle(
			playerScreenPosition.x + powerDeltaX * t,
			playerScreenPosition.y + powerDeltaY * t,
			1
		);
	}
};

const shoot = () => {
	const playerPosition = worldToWindow(
		players[socketId].x,
		players[socketId].y
	);

	// Vector from mouse to player
	const deltaX = playerPosition.x - mouseX;
	const deltaY = mouseY - playerPosition.y;

	const angle = Math.atan2(deltaY, deltaX);
	const magnitude = Math.sqrt(deltaX ** 2 + deltaY ** 2);

	socket.emit("shoot", { power: magnitudeToPower(magnitude), angle: angle });
};

// Socket
const socket = io();
let map, players, socketId;
socket.on("socketId", (id) => {
	socketId = id;
});
socket.on("updateMap", (newMap) => {
	map = newMap;
	console.log("Map recieved:", map);
});

socket.on("updatePlayers", (newPlayers) => {
	players = newPlayers;
});

const drawMap = () => {
	if (!map) return;
	const { x: sx, y: sy } = worldToScreen(map.startHole.x, map.startHole.y);
	const { x: gx, y: gy } = worldToScreen(map.goalHole.x, map.goalHole.y);
	ctx.fillStyle = "#F00";
	ctx.beginPath();
	ctx.rect(
		sx - 2,
		sy - 2,
		worldDimensionToScreen(2),
		worldDimensionToScreen(2)
	);
	ctx.fill();
	ctx.fillStyle = "#00F";
	fillCircle(gx, gy, 2);
	ctx.strokeStyle = "#FFF";
	ctx.lineWidth = worldDimensionToScreen(2);
	for (const wall of map.walls) {
		const { x: x1, y: y1 } = worldToScreen(wall.x1, wall.y1);
		const { x: x2, y: y2 } = worldToScreen(wall.x2, wall.y2);
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
	}
};

const drawPlayers = () => {
	if (!players) return;
	for (const id of Object.keys(players)) {
		ctx.fillStyle = id === socketId ? "#0F0" : "#FF0";
		const { x, y } = worldToScreen(players[id].x, players[id].y);
		fillCircle(x, y, 2);
	}
};

const update = () => {
	ctx.clearRect(
		-internalWidth * 0.5,
		-internalHeight * 0.5,
		internalWidth,
		internalHeight
	);
	ctx.fillStyle = "#000";
	ctx.beginPath();
	ctx.rect(
		-internalWidth * 0.5,
		-internalHeight * 0.5,
		internalWidth,
		internalHeight
	);
	ctx.fill();

	if (socketId) {
		cameraX = players[socketId].x;
		cameraY = players[socketId].y;
	}

	drawMap();
	drawPlayers();
	drawGuide();
};

setInterval(update, 16.7); // 1000/60
