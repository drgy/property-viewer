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

        this._element.addEventListener('pointerdown', () => {
            this._pointer_lock_time = Date.now();
        });

        this._element.addEventListener('pointerup', e => {
            if (Date.now() <= (this._pointer_lock_time || Date.now()) + DRAG_THRESHOLD) {
                const screen_position = new three.Vector2((e.clientX / Context.renderer.domElement.clientWidth) * 2 - 1, -(e.clientY / Context.renderer.domElement.clientHeight) * 2 + 1);
                this._click_callbacks.forEach(callback => callback(screen_position));
            }

            this._pointer_lock_time = null;
        });

        this._element.addEventListener('pointermove', e => {
            if (this._pointer_lock_time && Date.now() > this._pointer_lock_time + DRAG_THRESHOLD) {
                this._move_callbacks.forEach(callback => callback(e));
            }
        });
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