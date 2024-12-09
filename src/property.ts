import * as three from 'three';
import { Loader } from "./loader.ts";
import { Octree } from 'three/addons/math/Octree.js';

export class Property extends three.Group {
    protected _scene: three.Scene;
    protected _hdr = new three.DataTexture();
    protected _collider = new Octree();

    public get collider(): Octree {
        return this._collider;
    }

    constructor(data: PropertyData, scene: three.Scene) {
        super();
        this._scene = scene;

        Loader.load_hdr(data.hdr.file);
        Loader.load_gltf(data.models.map(model => model.file));
        Loader.on_load(load_data => {
            this._hdr = load_data.hdr;
            this._hdr.mapping = three.EquirectangularReflectionMapping;
            this._hdr.needsUpdate = true;
            this._scene.background = this._hdr;
            this._scene.backgroundRotation.set(data.hdr.rotation.x, data.hdr.rotation.y, data.hdr.rotation.z);

            for (const model of load_data.models) {
                this.add(model);

                const axes = new three.AxesHelper();
                axes.position.copy(model.position);
                axes.rotation.copy(model.rotation);
                axes.material.depthTest = false;
                axes.renderOrder = 1;
                this._scene.add(axes);
            }

            this.traverse(object => {
                if (object instanceof three.Mesh) {
                    object.receiveShadow = true;

                    if (object.material.name !== 'Glass') {
                        object.castShadow = true;
                    }
                }
            })

            this._collider.fromGraphNode(this);
            this._scene.add(this);
        });

        for (const light of data.lights) {
            switch (light.type) {
                case LightType.Ambient:
                    this._scene.add(new three.AmbientLight(light.color, light.intensity));
                    break;
                case LightType.Directional:
                    const directional_light = new three.DirectionalLight(light.color, light.intensity);
                    directional_light.position.set(light.position.x, light.position.y, light.position.z);
                    directional_light.target.position.set(light.target.x, light.target.y, light.target.z);
                    directional_light.castShadow = true;
                    directional_light.shadow.camera.bottom = -7;
                    directional_light.shadow.camera.top = 7;
                    directional_light.shadow.camera.left = -7;
                    directional_light.shadow.camera.right = 7;
                    directional_light.shadow.mapSize.set(4096, 4096);
                    directional_light.shadow.bias = -0.0001;
                    directional_light.shadow.normalBias = -0.0001;
                    directional_light.shadow.blurSamples = 16;
                    directional_light.shadow.camera.updateProjectionMatrix();
                    scene.add(directional_light);
                    break;
            }
        }
    }
}

export interface PropertyData {
    hdr: {
        file: string;
        rotation: {
            x: number;
            y: number;
            z: number;
        }
    }
    models: {
        file: string;
    }[];
    lights: (AmbientLightData | DirectionalLightData)[],
    config_options: {
        [name: string]: {
            materials: string[]
        }
    }[];
}

interface AmbientLightData {
    type: LightType.Ambient;
    color: string;
    intensity: number;
}

interface DirectionalLightData {
    type: LightType.Directional;
    color: string;
    intensity: number;
    position: {
        x: number;
        y: number;
        z: number;
    };
    target: {
        x: number;
        y: number;
        z: number;
    };
}

enum LightType {
    Ambient = 'ambient',
    Directional = 'directional'
}