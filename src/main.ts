import * as three from 'three';
import data from './data.json';
import {Player} from "./player.ts";
import {Input} from "./input.ts";
import {Property} from "./property.ts";

const canvas = document.querySelector('canvas')!;
const renderer = new three.WebGLRenderer({ antialias: true, canvas });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = three.PCFSoftShadowMap;
renderer.toneMapping = three.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const input = new Input(canvas);
const player = new Player(input);

const scene = new three.Scene();
scene.add(new three.GridHelper(100, 100));

const resize_observer = new ResizeObserver(() => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    player.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    player.camera.updateProjectionMatrix();
});
resize_observer.observe(canvas);

const property = new Property(data[0], scene);

const clock = new three.Clock();

function render() {
    player.update(clock.getDelta(), property.collider);

    renderer.render(scene, player.camera);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);