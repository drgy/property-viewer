import * as three from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { Octree } from 'three/addons/math/Octree.js';
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js';
import { Capsule } from 'three/addons/math/Capsule.js';

const WORLD_SIZE = 200;
const MOVEMENT_SPEED = 4;
const MOUSE_SPEED = 0.002;
const MIN_PITCH = 0;
const MAX_PITCH = Math.PI;

const canvas = document.querySelector('canvas')!;
const renderer = new three.WebGLRenderer({ antialias: true, canvas });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = three.PCFSoftShadowMap;
renderer.toneMapping = three.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const camera = new three.PerspectiveCamera(45, 2, 0.1, WORLD_SIZE);
camera.position.set(0, 1.8, 5);

const scene = new three.Scene();
scene.add(new three.GridHelper(WORLD_SIZE, WORLD_SIZE));

const resize_observer = new ResizeObserver(() => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
});
resize_observer.observe(canvas);

const input = new Map<string, boolean>();
const camera_euler = new three.Euler(0, 0, 0, 'YXZ');

canvas.addEventListener('keydown', e => input.set(e.key, true));
canvas.addEventListener('keyup', e => input.set(e.key, false));
canvas.addEventListener('pointerdown', () => canvas.requestPointerLock());
canvas.addEventListener('pointerup', () => document.exitPointerLock());
canvas.addEventListener('pointermove', e => {
    if (document.pointerLockElement === canvas) {
        camera_euler.setFromQuaternion(camera.quaternion);

        camera_euler.y -= e.movementX * MOUSE_SPEED;
        camera_euler.x -= e.movementY * MOUSE_SPEED;

        camera_euler.x = Math.max((Math.PI / 2) - MAX_PITCH, Math.min((Math.PI / 2) - MIN_PITCH, camera_euler.x));

        camera.quaternion.setFromEuler(camera_euler);
    }
});

const octree = new Octree();
const player_collider = new Capsule(new three.Vector3(0, 0, 0), new three.Vector3(0, 1.8, 0), 0.2);
const velocity = new three.Vector3();
const direction = new three.Vector3();

function forward(forward: three.Vector3): three.Vector3 {
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    return forward;
}

function right(right: three.Vector3): three.Vector3 {
    camera.getWorldDirection(right);
    right.y = 0;
    right.normalize();
    right.cross(camera.up);
    return right;
}

const directional_light = new three.DirectionalLight(0xffffff, 10);
directional_light.position.set(-10, 4, 8);
directional_light.castShadow = true;
directional_light.shadow.camera.bottom = -7;
directional_light.shadow.camera.top = 7;
directional_light.shadow.camera.left = -7;
directional_light.shadow.camera.right = 7;
directional_light.shadow.mapSize.set(4096, 4096);
directional_light.shadow.bias = -0.0001;
directional_light.shadow.normalBias = -0.0001;
directional_light.shadow.blurSamples = 16;
directional_light.shadow.camera.updateProjectionMatrix();
scene.add(directional_light);

scene.add(new three.DirectionalLightHelper(directional_light));
scene.add(new three.CameraHelper(directional_light.shadow.camera));

scene.add(new three.AmbientLight(0xeeeeff, 2));

const load_manager = new three.LoadingManager();
const gltf_loader = new GLTFLoader(load_manager);
const hdr_loader = new RGBELoader(load_manager);

let hdr: three.DataTexture;
hdr_loader.setDataType(three.FloatType);
hdr_loader.load('./beach.hdr', texture => hdr = texture);

const gltf_urls = [ './room.glb', './table.glb' ];
const gltf_models = new Map<string, GLTF>();

for (const url of gltf_urls) {
    gltf_loader.load(url, gltf => gltf_models.set(url, gltf));
}

load_manager.onProgress = (current_url, loaded, total) => {
    console.log(`loading ${loaded/total}: ${current_url}`);
};

load_manager.onLoad = () => {
    hdr.mapping = three.EquirectangularReflectionMapping;
    hdr.needsUpdate = true;
    scene.background = hdr;

    scene.backgroundRotation.y = -Math.PI / 2.75;
    scene.environmentRotation.y = -Math.PI / 2.75;

    for (const gltf of gltf_models.values()) {
        scene.add(gltf.scene);

        gltf.scene.traverse(obj => {
            if (obj instanceof three.Mesh) {
                obj.receiveShadow = true;

                if (obj.material.name !== 'Glass') {
                    obj.castShadow = true;
                }
            }
        });

        const axes = new three.AxesHelper();
        axes.material.depthTest = false;
        axes.renderOrder = 1;
        gltf.scene.add(axes);
    }

    octree.fromGraphNode(gltf_models.get('./room.glb')!.scene);
    scene.add(new OctreeHelper(octree));
}

const clock = new three.Clock();

function render() {
    velocity.set(0, 0, 0);

    if (input.get('w')) {
        velocity.add(forward(direction));
    }

    if (input.get('s')) {
        velocity.sub(forward(direction));
    }

    if (input.get('d')) {
        velocity.add(right(direction));
    }

    if (input.get('a')) {
        velocity.sub(right(direction));
    }

    velocity.normalize();
    velocity.multiplyScalar(MOVEMENT_SPEED * clock.getDelta());

    player_collider.translate(velocity);

    const collision = octree.capsuleIntersect(player_collider);

    if (collision && collision.depth >= 0.0001) {
        player_collider.translate(collision.normal.multiplyScalar(collision.depth));
    }

    camera.position.copy(player_collider.end);

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);