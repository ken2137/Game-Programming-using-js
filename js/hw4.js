import { MMDAnimationHelper } from './MMDAnimationHelper.js';
import { MMDPhysics } from './MMDPhysics.js';
var miku, mikuPoseHelper, mikuObj;
function loadMiku(parent) {
    mikuPoseHelper = new MMDAnimationHelper();
    var modelFile = "./vendor/models/miku/miku.pmx";
    // var vpdFile = "./vendor/models/miku/4.vpd";
    var loader = new THREE.MMDLoader();
    loader.load(modelFile, function (mesh) {
        mikuObj = mesh;
        miku = unitize(mesh, 80);
        miku.position.set(15, 0, 20);
        parent.add(miku);
        // loader.loadVPD(vpdFile, false, function (vpd) {
        //     mikuPoseHelper.pose(mesh, vpd);
        // }, onProgress, null);
    }, onProgress, null);
}
export { loadMiku, miku, mikuPoseHelper, mikuObj }