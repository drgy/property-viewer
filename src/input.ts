export class Input {
    protected _element: Element;
    protected _input = new Map<string, boolean>();
    protected _move_callbacks: ((event: PointerEvent) => void)[] = [];
    protected _pointer_lock = false;

    constructor(element: Element) {
        this._element = element;
        this._element.addEventListener('keydown', e => this._input.set(e.key, true));
        this._element.addEventListener('keyup', e => this._input.set(e.key, false));

        this._element.addEventListener('pointerdown', () => {
            this._pointer_lock = true;
            this._element.requestPointerLock();
        });

        this._element.addEventListener('pointerup', () => {
            this._pointer_lock = false;
            document.exitPointerLock();
        });

        this._element.addEventListener('pointermove', e => {
            if (this._pointer_lock) {
                this._move_callbacks.forEach(callback => callback(e));
            }
        });
    }

    public pressing(key: string): boolean {
        return this._input.get(key) || false;
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