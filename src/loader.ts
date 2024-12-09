import * as three from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

export class Loader {
    static #instance: Loader | undefined = undefined;

    protected _manager = new three.LoadingManager();
    protected _gltf = new GLTFLoader(this._manager);
    protected _hdr = new RGBELoader(this._manager);
    protected _callbacks: ((data: LoaderData) => void)[] = [];
    protected _data: LoaderData = { hdr: new three.DataTexture(), models: [] };

    protected static get instance(): Loader {
        if (Loader.#instance === undefined) {
            Loader.#instance = new Loader();
        }

        return Loader.#instance;
    }

    protected constructor() {
        this._hdr.setDataType(three.FloatType);

        this._manager.onProgress = (current_url, loaded, total) => {
            console.log(`loading ${loaded/total}: ${current_url}`);
        };

        this._manager.onLoad = () => {
            this._callbacks.forEach(callback => callback(Loader.instance._data));
            Loader.#instance = undefined;
        }
    }

    public static load_gltf(urls: string[]) {
        for (const url of urls) {
            Loader.instance._gltf.load(url, gltf => Loader.instance._data.models.push(gltf.scene));
        }
    }

    public static load_hdr(url: string): void {
        Loader.instance._hdr.load(url, texture => Loader.instance._data.hdr = texture);
    }

    public static on_load(callback: (data: LoaderData) => void) {
        Loader.instance._callbacks.push(callback);
    }
}

export interface LoaderData {
    hdr: three.DataTexture,
    models: three.Group[]
}
