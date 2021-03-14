/////////////////////////////////////////////////////////
// global variables
var camera, renderer;
var agents = [];
var clock;

var model;

var minTargetCnt = 4;

// program starts here ...
init();
animate();

function init() {

    initThree();

    //scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.z = 500;
    camera.position.y = 400;


    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x888888);

    let controls = new THREE.OrbitControls(camera, renderer.domElement);

    document.body.appendChild(renderer.domElement);

    /////////////////////////////////////////////////////////////////////


    // scene grid [-400,400]x[-400,400]
    // var gridXZ = new THREE.GridHelper(800, 80, 'red', 'white');
    // scene.add(gridXZ);

    //海洋  作者： Lionello DelPiccolo|https://freestocktextures.com/texture/clear-blue-sea,961.html
    let ocean = new THREE.TextureLoader().load('vendor/textures/ocean.jpg');
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(5910*1.5, 3940*1.5),
        new THREE.MeshBasicMaterial({
            polygonOffset: true,
            polygonOffsetFactor: 0.1,
            map: ocean,
            side: THREE.DoubleSide
        })
    );
    floor.position.x = -0.1;
    scene.add(floor);
    floor.rotation.x = -Math.PI / 2;

    let cubeMap = loadCubemap("vendor/textures/cubeMap4/");
    scene.background = cubeMap;

    // 初始化場景物件
    initRandomMeshPos();

    //讀取車子的model
    model = new THREE.Group();
    //https://poly.google.com/view/8Ke5qCnWxsZ
    let other = { prevPath: 'vendor/models/' };
    readModel('shark', 'shark', 100, model, other);
    //////////////////////////////////////////////////////////////////////////	
    clock = new THREE.Clock();
    //場景全亮
    lightInit();
}

var test;
function animate() {
    if (model.children.length != 0) {
        //鯊魚嘴巴的位置為中心點
        model.children[0].children[0].position.set(-22, 5, -0.5)
        let size = 22.49024987220764; // halfsize of agent
        agent = new Agent(new THREE.Vector3(-400 + 400 * Math.random(), 0, -400 + 400 * Math.random()), size, model);
        test = agent;
        agents.push(agent);
        let bias = 50;
        //多幾條鯊魚好朋友
        friendCnt = 5;
        for (let i = 0; i < friendCnt; i++) {
            let pos = agent.pos.clone();
            pos.x += Math.random() * bias - bias / 2;
            pos.z += Math.random() * bias - bias / 2;
            agents.push(new Agent(pos, size, model.clone()));
        }
        //新增車到場景，提供計算自己與鄰居的力量
        scene.agents = agents;
        animate = () => {
            let dt = clock.getDelta();
            agents.forEach((agent) => {
                agent.update(dt);
            })

            // check agent crossing obstacles ...
            scene.obstacles.forEach(function (obs) { obs.checkCollision(agent) });

            if (scene.targets.length == minTargetCnt) {
                for (let i = 0; i < 5; i++) {
                    scene.targets.push(Target.createOne(scene.obstacles));
                }
            }
            requestAnimationFrame(animate);
            render();
        }
    }
    render();
    requestAnimationFrame(animate);
}

function render() {
    renderer.render(scene, camera);
}

function lightInit() {
    // directional light
    let dLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dLight.position.set(80, 160, -100);
    dLight.castShadow = true;
    dLight.shadow.camera.left = -500;
    dLight.shadow.camera.top = -500;
    dLight.shadow.camera.right = 500;
    dLight.shadow.camera.bottom = 500;
    dLight.shadow.camera.near = 1;
    dLight.shadow.camera.far = 500;
    dLight.target = scene;
    dLight.shadow.mapSize.width = dLight.shadow.mapSize.height = 2048;
    dLight.shadow.bias = -.05;
    scene.add(dLight);
    //環境光
    let ambientLight = new THREE.AmbientLight(0x888888);
    scene.add(ambientLight);
}


function loadCubemap(path) {
    var format = '.png';
    var files = [
        path + 'posx' + format, path + 'negx' + format,
        path + 'posy' + format, path + 'negy' + format,
        path + 'posz' + format, path + 'negz' + format
    ];
    var loader = new THREE.CubeTextureLoader();
    var cubeMap = loader.load(files);
    cubeMap.format = THREE.RGBFormat;
    return cubeMap;
}