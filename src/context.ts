import * as three from 'three';
import {Property} from "./property.ts";
import {Viewer} from "./viewer.ts";

export class Context {
    static #instance: Context | undefined = undefined;
    protected _renderer: three.WebGLRenderer | undefined;
    protected _scene: three.Scene | undefined;
    protected _property: Property | undefined;
    protected _viewer: Viewer | undefined;
    protected _mobile = false;

    public static get performance(): Performance {
        const start = Date.now();
        const ctx = Context.instance._renderer!.getContext()!;

        for (let i = 0; i < 25; i++) {
            const scene = new three.Scene();
            const camera = new three.PerspectiveCamera();
            camera.lookAt(new three.Vector3(0, 0, 0));
            const texture = new three.Texture(ctx.canvas);
            const material = new three.MeshStandardMaterial({ map: texture });
            const geometry = new three.BoxGeometry();
            const mesh = new three.Mesh(geometry, material);
            scene.add(camera, mesh);
            Context.instance._renderer!.render(scene, camera);
            scene.remove(camera, mesh);
            geometry.dispose();
            material.dispose();
            texture.dispose();
        }

        return Date.now() - start > 350 ? Performance.LOW : Performance.HIGH;
    }

    public static get renderer(): three.WebGLRenderer {
        return Context.instance._renderer!;
    }

    public static set renderer(renderer: three.WebGLRenderer | undefined) {
        Context.instance._renderer = renderer;
    }

    public static get scene(): three.Scene {
        return Context.instance._scene!;
    }

    public static set scene(scene: three.Scene | undefined) {
        Context.instance._scene = scene;
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
    }

    public static get mobile(): boolean {
        return Context.instance._mobile;
    }

    public static set mobile(mobile: boolean) {
        Context.instance._mobile = mobile;
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