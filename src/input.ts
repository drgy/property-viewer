import * as three from 'three';
import {Context} from "./context.ts";

const DRAG_THRESHOLD = 100;

export class Input {
    protected _element: Element;
    protected _input = new Map<string, boolean>();
    protected _click_callbacks: ((screen_position: three.Vector2) => void)[] = [];
    protected _move_callbacks: ((event: PointerEvent) => void)[] = [];
    protected _pointer_lock_time: number | null = null;

    public joystick_input = new three.Vector2();

    constructor(element: Element) {
        this._element = element;
        this._element.addEventListener('keydown', e => this._input.set((e as KeyboardEvent).key, true));
        this._element.addEventListener('keyup', e => this._input.set((e as KeyboardEvent).key, false));

        this._element.addEventListener('pointerdown', e => {
            this._input.set(`mouse${(e as PointerEvent).button}`, true);

            if ((e as PointerEvent).button === 0) {
                this._pointer_lock_time = Date.now();
            }
        });

        this._element.addEventListener('pointerup', e => {
            if ((e as PointerEvent).button === 0) {
                if (Date.now() <= (this._pointer_lock_time || Date.now()) + DRAG_THRESHOLD) {
                    const screen_position = this.normalize_screen_position((e as PointerEvent).clientX, (e as PointerEvent).clientY);
                    this._click_callbacks.forEach(callback => callback(screen_position));
                }

                this._pointer_lock_time = null;
            }

            this._input.set(`mouse${(e as PointerEvent).button}`, false);
            e.stopPropagation();
        });

        document.addEventListener('pointerup', e => {
            this._pointer_lock_time = null;
            this._input.set(`mouse${(e as PointerEvent).button}`, false);
        });
        document.addEventListener('pointerout', e => {
            this._pointer_lock_time = null;
            this._input.set(`mouse${(e as PointerEvent).button}`, false);
        });

        this._element.addEventListener('pointermove', e => {
            this._move_callbacks.forEach(callback => callback(e as PointerEvent));
        });

        this.init_joystick();
    }

    protected init_joystick() {
        const joystick = document.querySelector<HTMLDivElement>('.joystick')!;
        const handle = document.querySelector<HTMLDivElement>('.handle')!;

        if (!('ontouchstart' in window) && !navigator.maxTouchPoints) {
            joystick.hidden = true;
            return;
        }

        const handle_border_width = parseFloat(window.getComputedStyle(handle).borderWidth);
        const joystick_radius = (joystick.offsetWidth - parseFloat(window.getComputedStyle(joystick).borderWidth)) / 2;
        const handle_radius = (handle.offsetWidth - handle_border_width) / 2;
        const joystick_rect = joystick.getBoundingClientRect();

        const center = new three.Vector2(joystick_rect.left + joystick_radius, joystick_rect.top + joystick_radius);
        const position = new three.Vector2().copy(center);
        const delta = new three.Vector2();
        let joystick_active = false;

        const set_handle_position = (position: three.Vector2) => {
            handle.style.transform = `translate(${position.x - joystick_rect.left - handle_radius - handle_border_width}px, ${position.y - joystick_rect.top - handle_radius - handle_border_width}px)`;
        }

        const move_handle = (x: number, y: number)=> {
            delta.set(x - center.x, y - center.y);

            const length = Math.min(delta.length(), joystick_radius - handle_radius);
            const angle = delta.angle();

            position.set(center.x + Math.cos(angle) * length, center.y + Math.sin(angle) * length);

            this.joystick_input.copy(position).sub(center).divideScalar(joystick_radius);

            set_handle_position(position);
        }

        const animate_handle_to_center = () => {
            const duration = 200;
            let start = 0;

            const animate = (time: number) => {
                if (start === 0) {
                    start = time;
                }

                if (!joystick_active) {
                    position.lerp(center, (time - start) / duration);

                    this.joystick_input.copy(position).sub(center).divideScalar(joystick_radius);

                    set_handle_position(position);

                    if (position.distanceTo(center) > 0.5) {
                        requestAnimationFrame(animate);
                    } else {
                        position.copy(center);

                        this.joystick_input.copy(position).sub(center).normalize();

                        set_handle_position(position);
                    }
                }
            }

            requestAnimationFrame(animate);
        }

        set_handle_position(position);

        joystick.addEventListener('touchstart', event => {
            joystick_active = true;
            move_handle(event.touches[0].clientX, event.touches[0].clientY);
        }, { passive: true });

        joystick.addEventListener('touchmove', event => {
            if (joystick_active) {
                move_handle(event.touches[0].clientX, event.touches[0].clientY);
            }
        }, { passive: true });

        joystick.addEventListener('touchend', () => {
            joystick_active = false;
            animate_handle_to_center();
        }, { passive: true });
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