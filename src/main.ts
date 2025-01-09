import * as three from 'three';
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import {ShaderPass} from "three/addons/postprocessing/ShaderPass.js";
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

const fxaa = new ShaderPass(FXAAShader);

const resize_observer = new ResizeObserver(() => {
    Context.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    Context.composer.setSize(canvas.clientWidth, canvas.clientHeight);
    Context.mobile = canvas.clientWidth <= 600 || canvas.clientHeight <= 600;

    fxaa.uniforms.resolution.value.set(1 / canvas.clientWidth, 1 / canvas.clientHeight);

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

Context.composer.addPass(fxaa);

const clock = new three.Clock();

function render() {
    viewer.update(clock.getDelta());

    Context.render();
    requestAnimationFrame(render);
}

requestAnimationFrame(render);