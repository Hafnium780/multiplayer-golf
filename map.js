class Map {
	constructor(startX, startY, goalX, goalY) {
		this.walls = [];
		this.startHole = { x: startX, y: startY };
		this.goalHole = { x: goalX, y: goalY };
	}

	addWall(x1, y1, x2, y2) {
		this.walls.push(new Wall(x1, y1, x2, y2));
	}
}

class Wall {
	constructor(x1, y1, x2, y2) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
	}
}

module.exports = { Map, Wall };
