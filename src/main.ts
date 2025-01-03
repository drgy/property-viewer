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
    Context.mobile = canvas.clientWidth <= 600 || canvas.clientHeight <= 600;

    if (Context.mobile) {
        document.body.classList.add('mobile');
    } else {
        document.body.classList.remove('mobile');
    }
});
resize_observer.observe(canvas);

Context.scene = new three.Scene();

const input = new Input(canvas);
const viewer = new Viewer(input);

Loader.on_load(() => viewer.reset());

const index_match = window.location.pathname.match(/(?<=\/properties\/)[0-9]+/);
let index = 0;

if (!index_match) {
    window.location.pathname = '/properties/0';
} else {
    index = parseInt(index_match[0]);
}

// @ts-ignore
Context.property = new Property(data[index]);

const clock = new three.Clock();

function render() {
    viewer.update(clock.getDelta());

    Context.renderer.render(Context.scene, viewer.camera);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);