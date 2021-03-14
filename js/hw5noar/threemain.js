// threemain.js
var scene;

function initThree() {
	scene = new THREE.Scene();	
}


function postMessage (whichAgent, msg) {
	$('#message').text (whichAgent.name + ': ' + msg);
	setTimeout (function () {$('#message').text ('')}, 2000);
}
