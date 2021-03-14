/////////////////////////////////
/// HELPER FUNCTIONS
// p: the vector to be projected
// n: the normal defining the projection plane (unit vector)
// clarification: call by reference/pointer or call-by-value
function proj2plane(p, n) {
    return p.clone().projectOnPlane(n);
}

function CLAMP(x, xLo, xHi) {
    return x < xLo ? xLo : (x > xHi ? xHi : x);
}


class CCDSys {
    constructor(fkFunc) {
        this.axes = [];
        this.fkFunc = fkFunc
    }

    setCCDAxis(vec, id, angleLo, angleHi) {
        let CCD_axis = { axis: vec.clone(), jointid: id };
        let thetaLo = angleLo !== undefined ? angleLo : -1e4 // default: no limits
        let thetaHi = angleHi !== undefined ? angleHi : 1e4
        CCD_axis.limits = new THREE.Vector2(thetaLo, thetaHi)
        this.axes.push(CCD_axis)
    }

    solve(target, thetas) {
        // local variable for iterations
        let end = new THREE.Vector3();
        let base = new THREE.Vector3();

        // short hand 
        let axes = this.axes;

        // e.g., njoints = 2;
        // jointid: 0,0,1
        var njoints = axes[axes.length - 1].jointid + 1;
        var joints = [];
        for (var i = 0; i <= njoints; i++) joints[i] = new THREE.Vector3();

        this.fkFunc(thetas, joints);
        end.copy(joints[joints.length - 1]);

        // convergence
        const EPS = 1e-1;
        const MAXITER = 120;

        let t_target = new THREE.Vector3();
        let t_end = new THREE.Vector3();
        let tmpV = new THREE.Vector3();

        // iterations

        for (var iter = 0; iter < MAXITER; iter++) {
            for (var i = axes.length - 1; i >= 0; i--) {
                base.copy(joints[axes[i].jointid]);

                // this part is quite different from the C counterpart
                var axis = axes[i].axis.clone();
                for (var j = i - 1; j >= 0; j--)
                    axis.applyMatrix4(new THREE.Matrix4().makeRotationAxis(axes[j].axis, thetas[j]));

                // after this manipulation,
                // axis become world coordinate

                tmpV.subVectors(target, base);
                tmpV = proj2plane(tmpV, axis);
                t_target.copy(tmpV.normalize());

                tmpV.subVectors(end, base);
                tmpV = proj2plane(tmpV, axis);
                t_end.copy(tmpV.normalize());

                var dotV = t_end.dot(t_target);
                var angle = Math.acos(CLAMP(dotV, -1, 1));
                tmpV.crossVectors(t_end, t_target);
                var sign = (tmpV.dot(axis) > 0) ? 1 : -1;
                thetas[i] += sign * angle;

                // joint limit [-2.4, -0.1]
                thetas[i] = CLAMP(thetas[i], axes[i].limits.x, axes[i].limits.y)

                this.fkFunc(thetas, joints);
                end.copy(joints[joints.length - 1]);

                if (end.distanceTo(target) < EPS) {
                    return 1;
                }
            }
        }


        if (iter < MAXITER)
            return 1;
        else {
            // console.log("do not converge");   // does not mean "fail"
            // sometimes just mean "target not reachable"
            return 0;
        }

    } // end of solve


}