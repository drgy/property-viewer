import * as three from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const WORLD_SIZE = 200;

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
}

const clock = new three.Clock();

function render() {
    controls.activeLook = controls.mouseDragOn;
    controls.update(clock.getDelta());
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);