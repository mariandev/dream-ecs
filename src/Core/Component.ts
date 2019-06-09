export type ComponentName = string;
export class Component<T extends any, U extends T = any> {
    public readonly ValueUnsafe: T;
    public get Value() {
        return this.ValueUnsafe as unknown as (U extends object ? Readonly<T> : T);
    };

    constructor(value: T) {
        this.ValueUnsafe = value;
    }

    public static new<T>(name: string) {
        const ctor = class extends Component<T> {};

        Object.defineProperty(ctor, "name", {
            value: name,
            configurable: true,
            writable: false,
            enumerable: false
        });

        return ctor;
    }
}

export class TagComponent extends Component<null> {
    constructor() {
        super(null);
    }
}
