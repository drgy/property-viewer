import * as three from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';

const canvas = document.querySelector('canvas')!;
const renderer = new three.WebGLRenderer({ antialias: true, canvas });
renderer.shadowMap.enabled = true;

const camera = new three.PerspectiveCamera(45, 2, 0.1, 50);
camera.position.set(0, 1.8, 5);

const scene = new three.Scene();
scene.add(new three.GridHelper(100, 100));

const controls = new FirstPersonControls(camera, canvas);
controls.movementSpeed = 2;
controls.lookSpeed = 0.5;

const resize_observer = new ResizeObserver(() => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    controls.handleResize();
});
resize_observer.observe(canvas);

scene.add(new three.AmbientLight(0xffffff, 0.2));

const load_manager = new three.LoadingManager();
const gltf_loader = new GLTFLoader(load_manager);

const gltf_urls = [ './room.glb', './table.glb' ];
const gltf_models = new Map<string, GLTF>();

for (const url of gltf_urls) {
    gltf_loader.load(url, gltf => gltf_models.set(url, gltf));
}

load_manager.onProgress = (current_url, loaded, total) => {
    console.log(`loading ${loaded/total}: ${current_url}`);
};

load_manager.onLoad = () => {
    for (const gltf of gltf_models.values()) {
        scene.add(gltf.scene);

        gltf.scene.traverse(obj => {
            obj.castShadow = true;
            obj.receiveShadow = true;
        });

        const axes = new three.AxesHelper();
        axes.material.depthTest = false;
        axes.renderOrder = 1;
        gltf.scene.add(axes);
    }
}

const clock = new three.Clock();

function render() {
    controls.activeLook = controls.mouseDragOn;
    controls.update(clock.getDelta());
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);