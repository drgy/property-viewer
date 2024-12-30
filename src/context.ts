import * as three from 'three';
import {Property} from "./property.ts";

export class Context {
    static #instance: Context | undefined = undefined;
    protected _renderer: three.WebGLRenderer | undefined;
    protected _scene: three.Scene | undefined;
    protected _property: Property | undefined;
    protected _mobile = false;

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

    public static get mobile(): boolean {
        return Context.instance._mobile;
    }

    public static set mobile(mobile: boolean) {
        Context.instance._mobile = mobile;
    }

    public static dispose(scene: three.Scene) {
        scene.traverse(object => {
            const dispose_textures = (material: three.Material) => {
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