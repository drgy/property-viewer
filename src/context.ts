import * as three from 'three';
import {Property} from "./property.ts";

export class Context {
    static #instance: Context | undefined = undefined;
    protected _renderer: three.WebGLRenderer | undefined;
    protected _scene: three.Scene | undefined;
    protected _property: Property | undefined;

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

    protected static get instance(): Context {
        if (Context.#instance === undefined) {
            Context.#instance = new Context();
        }

        return Context.#instance;
    }

    protected constructor() {}


}