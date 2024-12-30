import * as three from 'three';
import {Property} from "./property.ts";
import {generate_selection} from "./selection.ts";
import {Context} from "./context.ts";

export class Inspector {
    protected _renderer = new three.WebGLRenderer({ antialias: true, canvas: document.createElement('canvas'), alpha: true, premultipliedAlpha: true });
    protected _rerender = false;
    protected _displayed_tints: { scene: three.Scene, camera: three.Camera, container: HTMLCanvasElement }[] = [];
    protected _displayed_materials: { scene: three.Scene, camera: three.Camera, container: HTMLCanvasElement }[] = [];
    protected _name: string;

    constructor(property: Property) {
        this._renderer.toneMapping = three.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1;
        this._renderer.setScissorTest(true);

        const root = document.createElement('div');
        root.classList.add('inspector');
        root.innerHTML = `
            <div class="navbar">
                <span class="back">&laquo;</span>
                <span class="property-selection-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-houses" viewBox="0 0 16 16">
                      <path d="M5.793 1a1 1 0 0 1 1.414 0l.647.646a.5.5 0 1 1-.708.708L6.5 1.707 2 6.207V12.5a.5.5 0 0 0 .5.5.5.5 0 0 1 0 1A1.5 1.5 0 0 1 1 12.5V7.207l-.146.147a.5.5 0 0 1-.708-.708zm3 1a1 1 0 0 1 1.414 0L12 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l1.854 1.853a.5.5 0 0 1-.708.708L15 8.207V13.5a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 13.5V8.207l-.146.147a.5.5 0 1 1-.708-.708zm.707.707L5 7.207V13.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V7.207z"/>
                    </svg>
                </span>
                <h1></h1>
            </div>
            <div class="tab-container">
                <div class="general">
                    <p class="description"></p>
                    <div class="general-data">
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-tags" viewBox="0 0 16 16">
                              <path d="M3 2v4.586l7 7L14.586 9l-7-7zM2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586z"/>
                              <path d="M5.5 5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m0 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M1 7.086a1 1 0 0 0 .293.707L8.75 15.25l-.043.043a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 0 7.586V3a1 1 0 0 1 1-1z"/>
                            </svg>
                            <p class="price"></p>
                        </div>
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-border-all" viewBox="0 0 16 16">
                              <path d="M0 0h16v16H0zm1 1v6.5h6.5V1zm7.5 0v6.5H15V1zM15 8.5H8.5V15H15zM7.5 15V8.5H1V15z"/>
                            </svg>
                            <p class="rooms"></p>
                        </div>
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-rulers" viewBox="0 0 16 16">
                              <path d="M1 0a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5v-1H2v-1h4v-1H4v-1h2v-1H2v-1h4V9H4V8h2V7H2V6h4V2h1v4h1V4h1v2h1V2h1v4h1V4h1v2h1V2h1v4h1V1a1 1 0 0 0-1-1z"/>
                            </svg>
                            <p class="size"></p>
                        </div>
                    </div>
                </div>
                <div class="customization">
                    <div class="materials-container">
                        <h2>Materials</h2>
                        <div class="materials"></div>
                    </div>
                    <div class="colors-container">
                        <h2>Colors</h2>
                        <div class="colors"></div>
                    </div>
                </div>
            </div>
        `;

        const tab_container = root.querySelector<HTMLDivElement>('.tab-container')!;
        tab_container.appendChild(generate_selection());

        root.querySelector('.back')!.addEventListener('click', (e) => {
            e.stopPropagation();
            this.show_general()
        });
        root.querySelector('.navbar')!.addEventListener('click', () => tab_container.hidden = !tab_container.hidden);
        root.querySelector('.property-selection-button')!.addEventListener('click', (e) => {
            e.stopPropagation();
            this.show_selection();
        })

        const general_container = root.querySelector<HTMLDivElement>('.general')!;
        const property_info = property.info;

        this._name = property_info.name;
        general_container.querySelector<HTMLParagraphElement>('.description')!.innerText = property_info.description;
        general_container.querySelector<HTMLParagraphElement>('.price')!.innerText = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(property_info.price);
        general_container.querySelector<HTMLParagraphElement>('.rooms')!.innerText = `${property_info.rooms} rooms`;
        general_container.querySelector<HTMLParagraphElement>('.size')!.innerText = `${property_info.size}m²`;

        document.body.appendChild(root);
        this.show_general();
    }

    protected generate_preview(material: three.MeshStandardMaterial): { scene: three.Scene, camera: three.Camera } {
        const scene = new three.Scene();
        const camera = new three.PerspectiveCamera(45, 1, 1, 10);
        camera.position.set(0, 2, 2);
        camera.lookAt(0, 0, 0);
        scene.add(camera);

        const directional = new three.DirectionalLight(0xffffff, 2);
        directional.position.set(-3, 4, 0);
        scene.add(directional);

        const geometry = new three.SphereGeometry();

        const sphere = new three.Mesh(geometry, material);
        scene.add(sphere);

        return { scene, camera };
    }

    protected render() {
        if (this._rerender) {
            return;
        }

        this._rerender = true;

        const draw = () => {
            this._rerender = false;

            for (const displayed_preview of [ ...this._displayed_materials, ...this._displayed_tints ]) {
                const preview_bb = displayed_preview.container.getBoundingClientRect();
                const canvas_bb = document.querySelector('.inspector .customization')!.getBoundingClientRect();

                if (preview_bb.bottom < canvas_bb.top || preview_bb.top > canvas_bb.bottom || preview_bb.right < canvas_bb.left || preview_bb.left > canvas_bb.right) {
                    return;
                }

                if (this._renderer.domElement.width < preview_bb.width || this._renderer.domElement.height < preview_bb.height) {
                    this._renderer.setSize(preview_bb.width, preview_bb.height, false);
                }

                if (this._renderer.domElement.width !== preview_bb.width || this._renderer.domElement.height !== preview_bb.height) {
                    this._renderer.domElement.width = preview_bb.width;
                    this._renderer.domElement.height = preview_bb.height;
                }

                this._renderer.setScissor(0, 0, preview_bb.width, preview_bb.height);
                this._renderer.setViewport(0, 0, preview_bb.width, preview_bb.height);

                this._renderer.render(displayed_preview.scene, displayed_preview.camera);

                const context = displayed_preview.container.getContext('2d')!;
                context.globalCompositeOperation = 'copy';
                context.drawImage(this._renderer.domElement, 0, 0, preview_bb.width, preview_bb.height, 0, 0, preview_bb.width, preview_bb.height);
            }
        }

        requestAnimationFrame(draw);
    }

    protected update_previews(materials: three.MeshStandardMaterial[], object: three.Mesh, container: HTMLDivElement): { scene: three.Scene, camera: three.Camera, container: HTMLCanvasElement }[] {
        container.innerHTML = '';

        const res = [];

        for (const material of materials) {
            const material_canvas = document.createElement('canvas');
            material_canvas.classList.add('preview');

            material_canvas.onclick = () => {
                object.material = material.clone();
            }

            const { scene, camera } = this.generate_preview(material.clone());
            container.appendChild(material_canvas);
            material_canvas.width = material_canvas.clientWidth;
            material_canvas.height = material_canvas.clientHeight;
            res.push({ scene, camera, container: material_canvas });
        }

        return res;
    }

    protected update_tints(tints: string[], material: three.MeshStandardMaterial, object: three.Mesh) {
        const colors_container = document.querySelector<HTMLDivElement>('.inspector .colors')!;

        this._displayed_tints.forEach(displayed_tint => Context.dispose(displayed_tint.scene));

        this._displayed_tints = [];

        if (tints.length <= 1) {
            document.querySelector<HTMLDivElement>('.inspector .colors-container')!.hidden = true;
            return;
        }

        document.querySelector<HTMLDivElement>('.inspector .colors-container')!.hidden = false;

        this._displayed_tints = this.update_previews(tints.map(tint => {
            const tinted_material = material.clone();
            tinted_material.color = new three.Color(tint);
            return tinted_material;
        }), object, colors_container);

        this.render();

        document.querySelector<HTMLDivElement>('.inspector .tab-container')!.style.height = `${document.querySelector<HTMLDivElement>('.inspector .tab-container .customization')!.clientHeight}px`;
    }

    protected update_materials(object: three.Mesh) {
        const materials_container = document.querySelector<HTMLDivElement>('.inspector .materials')!;

        this._displayed_materials.forEach(displayed_material => Context.dispose(displayed_material.scene));

        this._displayed_materials = [];

        if (object.userData.materials.length === 1) {
            materials_container.innerHTML = '';
            document.querySelector<HTMLDivElement>('.inspector .materials-container')!.hidden = true;
            this.update_tints(object.userData.materials[0].tints, object.userData.materials[0].material, object);
            return;
        }

        document.querySelector<HTMLDivElement>('.inspector .materials-container')!.hidden = false;

        this._displayed_materials = this.update_previews(object.userData.materials.map(option => {
            if (option.material.name === object.material.name) {
                this.update_tints(option.tints, option.material, object);
            }

            return option.material;
        }), object, materials_container);

        this.render();

        document.querySelector<HTMLDivElement>('.inspector .tab-container')!.style.height = `${document.querySelector<HTMLDivElement>('.inspector .tab-container .customization')!.clientHeight}px`;
    }

    public show_general() {
        document.querySelector<HTMLSpanElement>('.inspector .back')!.hidden = true;
        document.querySelector<HTMLSpanElement>('.inspector .property-selection-button')!.hidden = false;
        document.querySelector<HTMLHeadingElement>('.inspector h1')!.innerText = this._name;
        document.querySelector<HTMLDivElement>('.inspector .customization')!.hidden = true;
        document.querySelector<HTMLDivElement>('.inspector .selection')!.hidden = true;

        const general_container = document.querySelector<HTMLDivElement>('.inspector .general')!;
        const tab_container = document.querySelector<HTMLDivElement>('.inspector .tab-container')!;
        general_container.hidden = false;
        tab_container.hidden = false;
        tab_container.style.height = `${general_container.clientHeight}px`;
    }

    public show_selection() {
        document.querySelector<HTMLSpanElement>('.inspector .back')!.hidden = false;
        document.querySelector<HTMLSpanElement>('.inspector .property-selection-button')!.hidden = true;
        document.querySelector<HTMLHeadingElement>('.inspector h1')!.innerText = `Available properties`;
        document.querySelector<HTMLDivElement>('.inspector .customization')!.hidden = true;
        document.querySelector<HTMLDivElement>('.inspector .general')!.hidden = true;

        const selection_container = document.querySelector<HTMLDivElement>('.inspector .selection')!;
        const tab_container = document.querySelector<HTMLDivElement>('.inspector .tab-container')!;
        selection_container.hidden = false;
        tab_container.hidden = false;
        tab_container.style.height = `${selection_container.clientHeight}px`;
    }

    public inspect(object: three.Mesh) {
        if (object.userData.materials?.length) {
            document.querySelector<HTMLDivElement>('.inspector .tab-container')!.hidden = false;
            document.querySelector<HTMLHeadingElement>('.inspector h1')!.innerText = object.name;
            document.querySelector<HTMLDivElement>('.inspector .general')!.hidden = true;
            document.querySelector<HTMLSpanElement>('.inspector .back')!.hidden = false;
            document.querySelector<HTMLSpanElement>('.inspector .property-selection-button')!.hidden = true;
            document.querySelector<HTMLDivElement>('.inspector .customization')!.hidden = false;
            document.querySelector<HTMLDivElement>('.inspector .selection')!.hidden = true;

            this.update_materials(object);
        } else {
            this.show_general();
        }
    }

    public dispose() {
        document.querySelector<HTMLDivElement>('.inspector')!.remove();
        this._displayed_tints.forEach(displayed_tint => Context.dispose(displayed_tint.scene));
        this._displayed_materials.forEach(displayed_material => Context.dispose(displayed_material.scene));
        this._displayed_tints = [];
        this._displayed_materials = [];
        this._renderer.dispose();
    }
}