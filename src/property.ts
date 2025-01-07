import * as three from 'three';
import { Loader } from "./loader.ts";
import { Octree } from 'three/addons/math/Octree.js';
import {Context} from "./context.ts";
import {Inspector} from "./inspector.ts";
import loading_plan from './plan.svg?raw';

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

        const ANIM_DURATION = 240;
        const load_screen = document.createElement('div');
        const load_background = document.createElement('canvas');
        const load_canvas = document.createElement('canvas');
        const loading_text = document.createElement('h1');

        load_screen.style.width = '100vw';
        load_screen.style.height = '100vh';
        load_screen.style.background = '#1E3F88';
        load_screen.style.position = 'absolute';
        load_screen.style.top = '0';
        load_screen.style.marginTop = '-100vh';
        load_screen.style.zIndex = '100';
        load_screen.style.transition = `margin ${ANIM_DURATION}ms ease`;

        document.body.appendChild(load_screen);

        const width = parseInt(load_screen.computedStyleMap().get('width')!.toString());
        const height = parseInt(load_screen.computedStyleMap().get('height')!.toString());

        load_background.width = width;
        load_background.height = height;
        load_background.style.width = '100%';
        load_background.style.height = '100%';
        load_background.style.position = 'absolute';
        load_canvas.width = width;
        load_canvas.height = height;
        load_canvas.style.width = '100%';
        load_canvas.style.height = '100%';
        load_canvas.style.position = 'absolute';
        loading_text.textContent = 'Loading...';
        loading_text.style.color = '#dddddd';
        loading_text.style.position = 'absolute';
        loading_text.style.right = '1rem';
        loading_text.style.bottom = '1rem';
        loading_text.style.padding = '0';
        loading_text.style.margin = '0';
        loading_text.style.fontFamily = 'monospace';

        load_screen.append(load_background, load_canvas, loading_text);

        load_screen.style.marginTop = '0';

        this._info = data.info;
        this._inspector = new Inspector(this);

        setTimeout(() => {
            this.loading_animation(load_canvas.getContext('2d')!, load_background.getContext('2d')!, load_screen, ANIM_DURATION);

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

                Context.viewer!.reset();
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
        }, ANIM_DURATION);
    }

    protected loading_animation(ctx: CanvasRenderingContext2D, background_ctx: CanvasRenderingContext2D, container: HTMLDivElement, anim_duration: number) {
        const TARGET_GRID_GAP = 50;
        const STEP = Math.max(ctx.canvas.width, ctx.canvas.height) / 4000;
        let loaded = false;
        let started_loading = false;

        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const aspect = width / height;

        const parser = new DOMParser();
        const doc = parser.parseFromString(loading_plan, 'image/svg+xml');
        const lines: {
            start: { x: number; y: number; };
            end: { x: number; y: number; };
        }[] = [];
        const plan_width = parseInt(doc.querySelector<SVGElement>('svg')!.getAttribute('width')!);
        const plan_height = parseInt(doc.querySelector<SVGElement>('svg')!.getAttribute('height')!);
        const svg_scale = Math.min(width, height) / plan_width;
        const svg_x_offset = (width - plan_width * svg_scale) / 2;
        const svg_y_offset = (height - plan_height * svg_scale) / 2;

        doc.querySelectorAll<SVGLineElement>('line').forEach(line => {
            lines.push({
                start: { x: parseInt(line.getAttribute('x1') || '0') * svg_scale + svg_x_offset, y: parseInt(line.getAttribute('y1') || '0') * svg_scale + svg_y_offset },
                end: { x: parseInt(line.getAttribute('x2') || '0') * svg_scale + svg_x_offset, y: parseInt(line.getAttribute('y2') || '0') * svg_scale + svg_y_offset }
            });
        });
        let line_progress: number[] = lines.map(() => 0);

        const vertical_grid_count = Math.floor(width / TARGET_GRID_GAP) - 2;
        const vertical_grid_gap = width / (vertical_grid_count + 2);

        const horizontal_grid_count = Math.floor(height / TARGET_GRID_GAP) - 2;
        const horizontal_grid_gap = height / (horizontal_grid_count + 2);

        let last_time = 0;
        let vy = 0;
        let hx = 0;

        ctx.lineCap = 'round';
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#aaaaaa';

        background_ctx.lineCap = 'round';
        background_ctx.lineWidth = 1;
        background_ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        background_ctx.setLineDash([10, 10]);

        const animate = (now: number) => {
            if (!ctx || !ctx.canvas || !background_ctx || !background_ctx.canvas) {
                return;
            }

            if (started_loading && Loader.progress === 0) {
                if (container.style.marginTop === '-100vh') {
                    return;
                }

                loaded = true;
            }

            if (!started_loading && Loader.progress > 0) {
                started_loading = true;
            }

            const current_step = STEP * (now - last_time);
            last_time = now;

            const line_idx = loaded ? lines.length : Math.ceil(Loader.progress * lines.length);

            ctx.beginPath();

            for (let i = 0; i < line_idx; i++) {
                if (line_progress[i] >= 1) {
                    continue;
                }

                const next_progress = Math.min(line_progress[i] + current_step * 0.001, 1);
                const dx = lines[i].end.x - lines[i].start.x;
                const dy = lines[i].end.y - lines[i].start.y;
                ctx.moveTo(lines[i].start.x + (dx * line_progress[i]), lines[i].start.y + (dy * line_progress[i]));
                ctx.lineTo(lines[i].start.x + (dx * next_progress), lines[i].start.y + (dy * next_progress));
                line_progress[i] = next_progress;
            }

            ctx.closePath();

            background_ctx.beginPath();

            for (let x = vertical_grid_gap; x < width; x+= vertical_grid_gap) {
                background_ctx.moveTo(x, 0);
                background_ctx.lineTo(x, vy + current_step);
            }

            for (let y = horizontal_grid_gap; y < height; y += horizontal_grid_gap) {
                background_ctx.moveTo(0, y);
                background_ctx.lineTo(hx + current_step * aspect, y);
            }

            background_ctx.closePath();

            background_ctx.clearRect(0, 0, width, height);

            background_ctx.stroke();
            ctx.stroke();

            hx += current_step * aspect;
            vy += current_step;

            if (loaded) {
                setTimeout(() => {
                    container.style.marginTop = '-100vh';

                    setTimeout(() => {
                        container.remove();
                    }, anim_duration);
                }, 250);
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
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

        Context.dispose(Context.scene!);
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
    preview: string;
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