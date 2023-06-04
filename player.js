class Player {
	constructor(x, y) {
		// Position
		this.x = x;
		this.y = y;
		// Velocity
		this.vx = 0;
		this.vy = 0;
		// Drag (1 = no drag, 0 = no movement)
		this.drag = 0.96;
		// Stopped -> velocity = 0
		this.stopped = true;
		this.inHole = false;
	}

	update(dt, walls, goalHole) {
		if (this.inHole) return;
		const x1 = this.x;
		const y1 = this.y;
		this.vx *= this.drag;
		this.vy *= this.drag;
		this.x += this.vx * dt;
		this.y += this.vy * dt;
		const x2 = this.x;
		const y2 = this.y;
		const a1 = Math.atan2(y2 - y1, x2 - x1);
		for (const wall of walls) {
			const x3 = wall.x1;
			const y3 = wall.y1;
			const x4 = wall.x2;
			const y4 = wall.y2;

			// Does the wall collide with the path the ball takes?
			const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
			const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d;
			const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / d;
			if (0 <= t && t <= 1 && 0 <= u && u <= 1) {
				// If so, bounce the ball

				// Collision point
				const px = u * (x4 - x3) + x3;
				const py = u * (y4 - y3) + y3;
				// Wall angle
				const a2 = Math.atan2(y4 - y3, x4 - x3);
				// Difference in angle
				const a = a2 - a1;
				// Current velocity magnitude
				const cv = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
				// New velocities
				this.vy = cv * Math.sin(a + a2);
				this.vx = cv * Math.cos(a + a2);
				// // idk why i put this here
				// if (a > Math.PI / 2) {
				// 	a = Math.PI - a;
				// }
				// Shift back to collision point + a little more to stop another collision w same wall
				this.x = px + (u * this.vx * dt) / 100;
				this.y = py + (u * this.vy * dt) / 100;
				break;
			}
		}
		if (Math.abs(this.vx) < 1 && Math.abs(this.vy) < 1) {
			this.vx = 0;
			this.vy = 0;
			this.stopped = true;
		} else if (this.stopped) {
			this.stopped = false;
		}

		if (
			(this.x - goalHole.x) ** 2 + (this.y - goalHole.y) ** 2 < 15 &&
			this.vx ** 2 + this.vy ** 2 < 250000
		)
			this.inHole = true;
	}
}

module.exports = { Player };
