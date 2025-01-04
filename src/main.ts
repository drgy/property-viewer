import * as three from 'three';
import data from './data.json';
import {Viewer} from "./viewer.ts";
import {Input} from "./input.ts";
import {Property} from "./property.ts";
import {Context} from "./context.ts";

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
Context.viewer = viewer;

const search_params = new URLSearchParams(window.location.search);

if (search_params.has('listing')) {
    // @ts-ignore
    Context.property = new Property(data[search_params.get('listing')!]);
} else {
    // @ts-ignore
    Context.property = new Property(data[0]);
}

const clock = new three.Clock();

function render() {
    viewer.update(clock.getDelta());

    Context.renderer.render(Context.scene, viewer.camera);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);