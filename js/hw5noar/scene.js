function initRandomMeshPos() {
    // const JSONStr = '{"obstacles":[{"center":{"x":209.52434509802094,"y":-1.584297207979961e-14,"z":71.3504031550267},"size":40},{"center":{"x":3.9594796502145093,"y":5.5165438176416846e-14,"z":263.55695318495896},"size":40},{"center":{"x":5.42098955335508,"y":3.5646388308083605e-14,"z":-160.53706110138933},"size":40},{"center":{"x":-208.14531121285557,"y":-1.780298028666322e-14,"z":80.17749538510077},"size":40},{"center":{"x":6.152290480954046,"y":-1.6335404928678994e-14,"z":73.56812354974488},"size":40}],"targets":[{"id":0,"pos":{"x":-170.96098270075498,"y":1.4072922348060594e-13,"z":-121.78807842739616}},{"id":1,"pos":{"x":173.8093284377129,"y":3.632627064004123e-14,"z":-163.5989789182495}},{"id":2,"pos":{"x":248.1273914134486,"y":5.516543817640233e-14,"z":263.5569531850243}},{"id":3,"pos":{"x":-237.81629357811414,"y":5.1244638502615395e-14,"z":281.21466513488554}}]}';

    // let myScene = JSON.parse(JSONStr);

    let initTargetCnt = 5, initObstCnt = 5;
    scene.obstacles = []
    let pos = randomPos();
    let total = 1, nicePos = 0;
    scene.obstacles.push(new Obstacle(pos, 30));
    while (total < initObstCnt) {
        while (nicePos < total) {
            nicePos = 0;
            pos = randomPos();
            scene.obstacles.forEach((ob) => {
                if (pos.distanceTo(ob.center) > (ob.size + Target.size)) {
                    nicePos++;
                    console.log(pos.distanceTo(ob.center));
                    console.log( (ob.size + Target.size));
                }
            });
        }
        scene.obstacles.push(new Obstacle(pos, 30));
        total++;
    }
    // myScene.obstacles.forEach(function (obs) {
    //     scene.obstacles.push(new Obstacle(new THREE.Vector3(obs.center.x, obs.center.y, obs.center.z), 30))
    // })

    scene.targets = []
    while (scene.obstacles.length < initObstCnt) {

    }
    for (let i = 0; i < initTargetCnt; i++) {
        scene.targets.push(Target.createOne(scene.obstacles));
    }
}

function randomPos() {
    return new THREE.Vector3(
        Math.ceil(Math.random() * 800 - 400),
        0,
        Math.ceil(Math.random() * 800 - 400));
}