import * as three from 'three';
import data from './data.json';
import {Viewer} from "./viewer.ts";
import {Input} from "./input.ts";
import {Property} from "./property.ts";
import {Context} from "./context.ts";
import {Loader} from "./loader.ts";

const canvas = document.querySelector('canvas')!;
Context.renderer = new three.WebGLRenderer({ antialias: true, canvas });
Context.renderer.shadowMap.enabled = true;
Context.renderer.shadowMap.type = three.PCFSoftShadowMap;
Context.renderer.toneMapping = three.ACESFilmicToneMapping;
Context.renderer.toneMappingExposure = 1;

const resize_observer = new ResizeObserver(() => {
    Context.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
});
resize_observer.observe(canvas);

Context.scene = new three.Scene();
Context.scene.add(new three.GridHelper(100, 100));

const input = new Input(canvas);
const player = new Viewer(input);

Loader.on_load(() => player.reset());

Context.property = new Property(data[0]);

const clock = new three.Clock();

function render() {
    player.update(clock.getDelta());

    Context.renderer.render(Context.scene, player.camera);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);