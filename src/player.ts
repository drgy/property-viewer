import * as three from 'three';
import { Input } from './input';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

const MOUSE_SPEED = 0.002;
const MOVEMENT_SPEED = 4;
const MIN_PITCH = 0;
const MAX_PITCH = Math.PI;

export class Player {
    protected _input: Input;
    protected _camera = new three.PerspectiveCamera(45, 2, 0.1, 100);
    protected _euler = new three.Euler(0, 0, 0, 'YXZ');
    protected _quaternion = new three.Quaternion();
    protected _velocity = new three.Vector3();
    protected _direction = new three.Vector3();
    protected _collider = new Capsule(new three.Vector3(0, 0, 0), new three.Vector3(0, 1.8, 0), 0.2);

    public get camera(): three.PerspectiveCamera {
        return this._camera;
    }
    
    constructor(input: Input) {
        this._input = input;
        this._input.on_move(this.update_rotation.bind(this));
    }
    
    protected update_rotation(e: PointerEvent) {
        this._euler.setFromQuaternion(this._camera.quaternion);

        this._euler.y -= e.movementX * MOUSE_SPEED;
        this._euler.x -= e.movementY * MOUSE_SPEED;

        this._euler.x = Math.max((Math.PI / 2) - MAX_PITCH, Math.min((Math.PI / 2) - MIN_PITCH, this._euler.x));

        this._camera.quaternion.setFromEuler(this._euler);
    }

    public forward(forward: three.Vector3): three.Vector3 {
        this._camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        return forward;
    }

    public right(right: three.Vector3): three.Vector3 {
        this._camera.getWorldDirection(right);
        right.y = 0;
        right.normalize();
        right.cross(this._camera.up);
        return right;
    }
    
    public update(delta: number, octree: Octree) {
        this._velocity.set(0, 0, 0);

        if (this._input.pressing('w')) {
            this._velocity.add(this.forward(this._direction));
        }

        if (this._input.pressing('s')) {
            this._velocity.sub(this.forward(this._direction));
        }

        if (this._input.pressing('d')) {
            this._velocity.add(this.right(this._direction));
        }

        if (this._input.pressing('a')) {
            this._velocity.sub(this.right(this._direction));
        }

        this._velocity.normalize();
        this._velocity.multiplyScalar(MOVEMENT_SPEED * delta);

        this._collider.translate(this._velocity);

        const collision = octree.capsuleIntersect(this._collider);

        if (collision && collision.depth >= 0.0001) {
            this._collider.translate(collision.normal.multiplyScalar(collision.depth));
        }

        this._camera.position.copy(this._collider.end);
    }
}