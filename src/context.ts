import * as three from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {Property} from "./property.ts";
import {Viewer} from "./viewer.ts";

export class Context {
    static #instance: Context | undefined = undefined;
    protected _renderer: three.WebGLRenderer | undefined;
    protected _composer: EffectComposer | undefined;
    protected _scene: three.Scene | undefined;
    protected _property: Property | undefined;
    protected _viewer: Viewer | undefined;
    protected _mobile = false;
    protected _performance: Performance | undefined;

    public static get performance(): Performance {
        if (!Context.instance._performance) {
            const start = Date.now();
            const ctx = Context.instance._renderer!.getContext()!;

            for (let i = 0; i < 20; i++) {
                const scene = new three.Scene();
                const camera = new three.PerspectiveCamera();
                camera.lookAt(new three.Vector3(0, 0, 0));
                const texture = new three.Texture(ctx.canvas);
                const material = new three.MeshStandardMaterial({map: texture});
                const geometry = new three.BoxGeometry();
                const mesh = new three.Mesh(geometry, material);
                scene.add(camera, mesh);
                Context.instance._renderer!.render(scene, camera);
                scene.remove(camera, mesh);
                geometry.dispose();
                material.dispose();
                texture.dispose();
            }

            Context.instance._performance = Date.now() - start > 500 ? Performance.LOW : Performance.HIGH;
        }

        return Context.instance._performance;
    }

    public static get composer(): EffectComposer {
        return Context.instance._composer!;
    }

    public static get renderer(): three.WebGLRenderer {
        return Context.instance._renderer!;
    }

    public static set renderer(renderer: three.WebGLRenderer | undefined) {
        Context.instance._renderer = renderer;
        Context.instance._composer = new EffectComposer(Context.instance._renderer!);
        Context.setup_passes();
    }

    public static get scene(): three.Scene {
        return Context.instance._scene!;
    }

    public static set scene(scene: three.Scene | undefined) {
        Context.instance._scene = scene;
        Context.setup_passes();
    }

    public static get property(): Property | undefined {
        return Context.instance._property;
    }

    public static set property(property: Property | undefined) {
        Context.instance._property = property;
    }

    public static get viewer(): Viewer | undefined {
        return Context.instance._viewer;
    }

    public static set viewer(viewer: Viewer | undefined) {
        Context.instance._viewer = viewer;
        Context.setup_passes();
    }

    public static get mobile(): boolean {
        return Context.instance._mobile;
    }

    public static set mobile(mobile: boolean) {
        Context.instance._mobile = mobile;
    }

    public static render() {
        if (Context.composer) {
            Context.composer.render();
        }
    }

    public static dispose(scene: three.Scene) {
        scene.traverse(object => {
            const dispose_textures = (material: three.MeshStandardMaterial) => {
                material.map?.dispose();
                material.metalnessMap?.dispose();
                material.normalMap?.dispose();
                material.roughnessMap?.dispose();
            }

            if (object instanceof three.Mesh) {
                if (Array.isArray(object.material)) {
                    for (const material of object.material) {
                        dispose_textures(material);
                        material.dispose();
                    }
                } else {
                    dispose_textures(object.material);
                    object.material.dispose();
                }

                object.geometry.dispose();
            }
        });

        scene.clear();

        if (scene.background instanceof three.Texture) {
            scene.background.dispose();
        }
    }

    protected static setup_passes() {
        if (Context.viewer && Context.scene) {
            if (Context.composer.passes.length === 0) {
                Context.composer.addPass(new RenderPass(Context.scene, Context.viewer.camera));
                Context.composer.addPass(new OutputPass());
            }
        }
    }

    protected static get instance(): Context {
        if (Context.#instance === undefined) {
            Context.#instance = new Context();
        }

        return Context.#instance;
    }

    protected constructor() {}


}

export enum Performance {
    HIGH = 'high',
    LOW = 'low'
}