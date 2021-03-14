class Target {
	static idCnt = 0;
	static size = 8;
	constructor(id, pos) {
		Target.idCnt++;
		this.id = id;
		this.pos = pos.clone();
		this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(Target.size, Target.size, 3, 20),
			new THREE.MeshBasicMaterial({ color: 'yellow' }));
		this.found = false;  // default: not found yet
		this.mesh.position.copy(pos)
		scene.add(this.mesh);
	}
	attack() {
		this.mesh.material.color = new THREE.Color('red');
	}
	setFound(agent) {
		this.found = true;
		this.mesh.material.visible = false;
		// postMessage(agent, 'TARGET reached');

		agent.score += 10;

		// remove from scene.targets
		for (let i = 0; i < scene.targets.length; i++) {
			if (scene.targets[i].id === this.id) scene.targets.splice(i, 1)
		}
	}
	static createOne(obstacles) {
		let pos, nicePos = 0;
		while (nicePos < obstacles.length) {
			nicePos = 0;
			pos = Target.randomPos();
			obstacles.forEach((ob) => {
				if (pos.distanceTo(ob.center)> (ob.size*2 + Target.size)) {
					nicePos++;
				}
			});
			return new Target(Target.idCnt, pos);
		}
	}
	static randomPos() {
		return new THREE.Vector3(
			Math.ceil(Math.random() * 800 - 400),
			0,
			Math.ceil(Math.random() * 800 - 400))
	}
}