import * as three from 'three';
import { Loader } from "./loader.ts";
import { Octree } from 'three/addons/math/Octree.js';
import {Context} from "./context.ts";
import {Inspector} from "./inspector.ts";

export class Property extends three.Group {
    protected _inspector: Inspector;
    protected _hdr = new three.DataTexture();
    protected _collider = new Octree();
    protected _interactive: three.Object3D[] = [];
    protected _materials = new Map<string, three.MeshStandardMaterial>();
    protected _spawn = {
        position: new three.Vector3(),
        rotation: new three.Euler()
    };
    protected _info: PropertyInfo;

    public get info(): PropertyInfo {
        return this._info;
    }

    public get spawn_position(): three.Vector3 {
        return this._spawn.position;
    }

    public get spawn_rotation(): three.Euler {
        return this._spawn.rotation;
    }

    public get collider(): Octree {
        return this._collider;
    }

    constructor(data: PropertyData) {
        super();

        this._info = data.info;
        this._inspector = new Inspector(this);

        Loader.load_hdr(data.hdr.file);
        Loader.load_gltf(data.models.map(model => model.file));
        Loader.on_load(load_data => {
            this._hdr = load_data.hdr;
            this._hdr.mapping = three.EquirectangularReflectionMapping;
            this._hdr.needsUpdate = true;
            Context.scene.background = this._hdr;
            Context.scene.backgroundRotation.set(data.hdr.rotation.x, data.hdr.rotation.y, data.hdr.rotation.z);

            for (const model of load_data.models) {
                this.add(model);

                const axes = new three.AxesHelper();
                axes.position.copy(model.position);
                axes.rotation.copy(model.rotation);
                axes.material.depthTest = false;
                axes.renderOrder = 1;
                Context.scene.add(axes);
            }

            this.traverse(object => {
                if (object instanceof three.Mesh) {
                    object.receiveShadow = true;

                    if (object.material.name !== 'Glass') {
                        object.castShadow = true;
                    }

                    if (Array.isArray(object.material)) {
                        for (const material of object.material) {
                            if (!this._materials.has(material.name)) {
                                this._materials.set(material.name, material.clone());
                            }
                        }
                    } else {
                        if (!this._materials.has(object.material.name)) {
                            this._materials.set(object.material.name, object.material.clone());
                        }
                    }

                    this._interactive.push(object);
                }
            });

            for (const object of this._interactive) {
                for (const rule of Object.keys(data.config_options)) {
                    if (object.name.match(new RegExp(rule))) {
                        object.userData = {
                            materials: data.config_options[rule].materials.map(material => {
                                return {material: this._materials.get(material.name), tints: material.tints};
                            }),
                        };
                    }
                }
            }

            this._collider.fromGraphNode(this);
            Context.scene.add(this);
        });

        this._spawn.position.set(data.spawn.position.x, data.spawn.position.y, data.spawn.position.z);
        this._spawn.rotation.set(data.spawn.rotation.x, data.spawn.rotation.y, data.spawn.rotation.z, 'YXZ');

        for (const light of data.lights) {
            switch (light.type) {
                case LightType.Ambient:
                    Context.scene.add(new three.AmbientLight(light.color, light.intensity));
                    break;
                case LightType.Directional:
                    const directional_light = new three.DirectionalLight(light.color, light.intensity);
                    directional_light.position.set(light.position.x, light.position.y, light.position.z);
                    directional_light.target.position.set(light.target.x, light.target.y, light.target.z);
                    directional_light.castShadow = true;
                    directional_light.shadow.camera.bottom = -10;
                    directional_light.shadow.camera.top = 10;
                    directional_light.shadow.camera.left = -10;
                    directional_light.shadow.camera.right = 10;
                    directional_light.shadow.camera.far = 20;
                    directional_light.shadow.mapSize.set(4096, 4096);
                    directional_light.shadow.bias = -0.001;
                    directional_light.shadow.normalBias = -0.001;
                    directional_light.shadow.blurSamples = 4;
                    directional_light.shadow.camera.updateProjectionMatrix();
                    Context.scene.add(directional_light);
                    break;
                case LightType.Point:
                    const point_light = new three.PointLight(light.color, light.intensity, light.distance || 0, light.decay || 2);
                    point_light.position.set(light.position.x, light.position.y, light.position.z);
                    point_light.castShadow = true;
                    point_light.shadow.mapSize.set(2048, 2048);
                    point_light.shadow.bias = -0.0001;
                    point_light.shadow.normalBias = -0.0001;
                    point_light.shadow.blurSamples = 16;
                    point_light.shadow.camera.updateProjectionMatrix();
                    Context.scene.add(point_light);
                    break;
            }
        }
    }

    public intersection(raycaster: three.Raycaster): three.Intersection[] {
        return raycaster.intersectObjects(this._interactive);
    }

    public inspect(object: three.Mesh) {
        this._inspector.inspect(object);
    }

    public dispose() {
        this._inspector.dispose();

        for (const material of this._materials.values()) {
            material.dispose();
        }

        console.log(Context.renderer!.info.memory);

        Context.dispose(Context.scene!);

        console.log(Context.renderer!.info.memory);
        console.log(Context.renderer!.info.render);
    }
}

export interface PropertyData {
    info: PropertyInfo;
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
    lights: (AmbientLightData | DirectionalLightData | PointLightData)[],
    config_options: {
        [name: string]: {
            materials: {
                name: string;
                tints: string[]
            }[]
        }
    };
    spawn: {
        position: {
            x: number;
            y: number;
            z: number;
        },
        rotation: {
            x: number;
            y: number;
            z: number;
        }
    }
}

export interface PropertyInfo {
    name: string;
    price: number;
    rooms: number;
    size: number;
    description: string;
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

interface PointLightData {
    type: LightType.Point;
    color: string;
    intensity: number;
    decay?: number;
    distance?: number;
    position: {
        x: number;
        y: number;
        z: number;
    }
}

enum LightType {
    Ambient = 'ambient',
    Directional = 'directional',
    Point = 'point'
}