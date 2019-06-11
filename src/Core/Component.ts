export type ComponentName = string;

export type ComponentCtor<T> = { new (): Component<T> };
export type ComponentValue<T> = T extends ComponentCtor<infer U> ? U : unknown;

export abstract class Component<T extends unknown> {
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

export class TagComponent extends Component<void> {}
