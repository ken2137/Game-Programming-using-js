class Obstacle {
    constructor(center, size) {
        this.center = center.clone();
        this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(size, size, 0.05, 20),
            new THREE.MeshBasicMaterial());
        this.mesh.position.copy(center);
        this.size = size;
        markerRoot.add(this.mesh);
    }

    checkCollision(agent) {
        const HIT_CRITERIA = 0.8;
        // when the agent is inside 80% of the circle
        // then consider it HIT 
        if (this.center.distanceTo(agent.pos) < this.size * HIT_CRITERIA) {
            agent.score -= 0.1;
        }
    }
}

class Target {
    static idCnt = 0;
    static size = 0.05;
    constructor(id, pos) {
        Target.idCnt++;
        this.id = id;
        this.pos = pos.clone();
        this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(Target.size, Target.size, 0.05, 20),
            new THREE.MeshBasicMaterial({ color: 'yellow' }));
        this.found = false;  // default: not found yet
        this.mesh.position.copy(pos)
        markerRoot.add(this.mesh);
    }
    attack() {
        this.mesh.material.color = new THREE.Color('red');
    }
    setFound(agent) {
        this.found = true;
        this.mesh.material.visible = false;
        // postMessage(agent, 'TARGET reached');

        agent.score += 10;

        // remove from targets
        for (let i = 0; i < targets.length; i++) {
            if (targets[i].id === this.id) targets.splice(i, 1)
        }
    }
    static createOne(obstacles) {
        let pos, nicePos = 0;
        while (nicePos < obstacles.length) {
            nicePos = 0;
            pos = randomPos();
            obstacles.forEach((ob) => {
                if (pos.distanceTo(ob.center) > (ob.size + Target.size) * 1.2) {
                    nicePos++;
                }
            });
            return new Target(Target.idCnt, pos);
        }
    }
}

class Agent {
    static target = null;
    static distanceToNH = 0.01;

    constructor(pos, halfSize, obj) {
        // this.name = "孫學任";
        this.pos = pos.clone();
        this.vel = new THREE.Vector3();
        this.force = new THREE.Vector3();
        this.swimAngle = 0;
        this.halfSize = halfSize;  // half width
        if (obj === undefined)
            this.mesh = Agent.agentMesh(this.halfSize, 'red');
        else {
            this.mesh = obj;
            // this.mesh.add(Agent.agentMesh(this.halfSize, 'cyan'));
        }
        this.MAXSPEED = 2.5;
        this.ARRIVAL_R = 0.05;
        // for orientable agent
        this.angle = 0;

        markerRoot.add(this.mesh);
    }
    update(dt) {
        // about target ...
        if (Agent.target === null || Agent.target.found === true) {  // no more target OR target found by other agent
            // console.log('find target')
            Agent.findTarget(this);
            return;  // wait for next turn ...
        }

        this.accumulateForce();

        // collision
        // for all obstacles in the scene
        let obs = obstacles;

        // pick the most threatening one
        // apply the repulsive force
        // (write your code here)
        //要搜尋多遠的距離
        const REACH = 2;
        //K倍的力量推走
        const K = 70;
        //車子速度單位向量
        let vhat = this.vel.clone().normalize();
        obs.forEach((o) => {
            //車的位置到圓心的向量
            let point = o.center.clone().sub(this.pos);
            //正射影長
            let proj = point.dot(vhat);
            //如果正射影與REACH反向或是比REACH來得遠就不管了
            if (proj < 0 || proj > REACH) {
                return;
            }
            //正射影高
            let perp = point.clone().sub(vhat.clone().setLength(proj));
            //車與障礙物交疊的部分
            let overlap = this.halfSize / 2 + o.size - perp.length();
            // console.log(overlap)
            //有交疊→會撞到!!!
            if (overlap > 0) {
                perp.setLength(K * overlap);
                //反向
                perp.negate();
                //將推力加速這次的加速度中
                this.force.add(perp);
            }
        })

        // //鄰居推擠
        // let seoaration = new THREE.Vector3();
        // agents.forEach((agent) => {
        //     if (this == agent) return;
        //     //從鄰居座標往目前車子座標的向量
        //     let scared = this.pos.clone().sub(agent.pos);
        //     //調整權重
        //     scared.setLength(50);
        //     seoaration.add(scared);
        // });
        // seoaration.setLength(this.vel.length() * 2);
        // this.force.add(seoaration);
        // this.force.y = 0;


        // Euler's method
        this.vel.add(this.force.clone().multiplyScalar(dt));

        // 找到目標的半徑不想要是一個固定的數值
        // 假如速度太快，拉大快到達的半徑，提早進入速度下降的區域
        let arrVel = this.vel.length() * 0.1;
        this.ARRIVAL_R = 0.1 > arrVel ? 0.1 : arrVel;
        // velocity modulation
        let diff = Agent.target.pos.clone().sub(this.pos)
        let dst = diff.length();
        if (dst < this.ARRIVAL_R) {
            //速度也隨著目標半徑做變化
            this.vel.setLength(15 > dst * 2 ? 0.1 : dst * 2);
            const REACH_TARGET = 0.1;
            if (dst < REACH_TARGET) {// target reached
                // console.log('target reached');
                Agent.target.setFound(this);
                Agent.target = null;
            }
        }

        // Euler
        this.pos.add(this.vel.clone().multiplyScalar(dt))
        this.mesh.position.copy(this.pos)

        // for orientable agent
        // non PD version
        if (this.vel.length() > 0.1) {
            this.angle = Math.atan2(-this.vel.z, this.vel.x)
            this.mesh.rotation.y = this.angle
        }
    }

    static findTarget() {
        // console.log('total: ' + targets.length)
        let allTargets = targets;
        let d;
        let best = {
            i: 0,
            d: Number.POSITIVE_INFINITY,
            collision: Number.POSITIVE_INFINITY
        };
        for (let i = 0; i < allTargets.length; i++) {
            //車子位置到目標的距離
            d = agent.pos.distanceTo(allTargets[i].pos)
            let v = agent.pos.clone().sub(allTargets[i].pos);
            let collision = 0;
            //用maxima找到相交判別式
            //最小距離改為現在這個目標的
            //檢查兩點之間有幾個障礙物
            obstacles.forEach((o) => {
                let check = (-2 * o.center.y * v.y + 2 * agent.pos.y * v.y - 2 * o.center.x * v.x + 2 * agent.pos.x * v.x) ** 2
                    - 4 * (-(o.size ** 2) + o.center.y ** 2 - 2 * agent.pos.y * o.center.y + o.center.x ** 2 - 2 * agent.pos.x * o.center.x + agent.pos.y ** 2 + agent.pos.x ** 2) * (v.y ** 2 + v.x ** 2);
                //相交，BAD
                if (check >= 0) {
                    collision++;
                }
            });
            if (d * collision < best.d * best.collision) {
                best.i = i; best.d = d; best.collision = collision;
            }
        }
        Agent.target = allTargets[best.i];
        Agent.target.attack();
    }

    static agentMesh(size, colorName = 'red') {
        // mesh facing +x
        let geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(3 * size, 0, 0))
        geometry.vertices.push(new THREE.Vector3(0, 0, -size))
        geometry.vertices.push(new THREE.Vector3(0, 0, size))
        geometry.vertices.push(new THREE.Vector3(0, size, 0))

        geometry.faces.push(new THREE.Face3(0, 3, 2));
        geometry.faces.push(new THREE.Face3(0, 2, 1));
        geometry.faces.push(new THREE.Face3(1, 3, 0));
        geometry.faces.push(new THREE.Face3(1, 2, 3));
        geometry.computeFaceNormals()

        return new THREE.Mesh(geometry,
            new THREE.MeshBasicMaterial({ color: colorName, wireframe: true }))
    }

    targetInducedForce(targetPos) {
        return targetPos.clone().sub(this.pos).normalize().multiplyScalar(this.MAXSPEED).sub(this.vel)
    }

    accumulateForce() {
        // seek
        this.force.copy(this.targetInducedForce(Agent.target.pos));

        // let sum = new THREE.Vector3();
        // let push = new THREE.Vector3();
        // let nhCnt = 0;
        // agents.forEach((agent) => {
        //     if (this == agent) return;
        //     if (this.pos.distanceTo(agent.pos) > Agent.distanceToNH) return;
        //     // coherence
        //     sum.add(agent.pos);
        //     // separation
        //     let point = this.pos.clone().sub(agent.pos);
        //     push.add(point.setLength(1 / point.length()));
        //     nhCnt++;
        // });
        // sum.divideScalar(nhCnt);
        // this.force.add(this.targetInducedForce(sum));
        // this.force.add(push);
    }

}