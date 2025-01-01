import * as three from 'three';
import {Context} from "./context.ts";

const DRAG_THRESHOLD = 100;

export class Input {
    protected _element: Element;
    protected _input = new Map<string, boolean>();
    protected _click_callbacks: ((screen_position: three.Vector2) => void)[] = [];
    protected _move_callbacks: ((event: PointerEvent) => void)[] = [];
    protected _pointer_lock_time: number | null = null;

    constructor(element: Element) {
        this._element = element;
        this._element.addEventListener('keydown', e => this._input.set(e.key, true));
        this._element.addEventListener('keyup', e => this._input.set(e.key, false));

        this._element.addEventListener('pointerdown', (e) => {
            this._input.set(`mouse${e.button}`, true);

            if (e.button === 0) {
                this._pointer_lock_time = Date.now();
            }
        });

        this._element.addEventListener('pointerup', e => {
            if (e.button === 0) {
                if (Date.now() <= (this._pointer_lock_time || Date.now()) + DRAG_THRESHOLD) {
                    const screen_position = this.normalize_screen_position(e.clientX, e.clientY);
                    this._click_callbacks.forEach(callback => callback(screen_position));
                }

                this._pointer_lock_time = null;
            }

            this._input.set(`mouse${e.button}`, false);
        });

        this._element.addEventListener('pointermove', e => {
            this._move_callbacks.forEach(callback => callback(e));
        });
    }

    public normalize_screen_position(x: number, y: number): three.Vector2 {
        return new three.Vector2((x / Context.renderer.domElement.clientWidth) * 2 - 1, -(y / Context.renderer.domElement.clientHeight) * 2 + 1);
    }

    public pressing(key: string): boolean {
        return this._input.get(key) || false;
    }

    public on_click(callback: (screen_position: three.Vector2) => void) {
        this._click_callbacks.push(callback);
    }

    public on_click_remove(callback: (screen_position: three.Vector2) => void) {
        const index = this._click_callbacks.indexOf(callback);

        if (index >= 0) {
            this._click_callbacks.splice(index, 1);
        }
    }

    public on_move(callback: (event: PointerEvent) => void) {
        this._move_callbacks.push(callback);
    }

    public on_move_remove(callback: (event: PointerEvent) => void) {
        const index = this._move_callbacks.indexOf(callback);

        if (index >= 0) {
            this._move_callbacks.splice(index, 1);
        }
    }
}