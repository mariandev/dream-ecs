export type ComponentName = string;

export type ComponentCtor<T> = { new (): Component<T> };
export type ComponentValue<T> = T extends ComponentCtor<infer U> ? U : unknown;

export abstract class Component<T extends any> {
    // Source: https://stackoverflow.com/a/55887088
    public _fixYourShitTypescript: T = undefined as unknown as T;

    public static new<T = void>(name: string) {
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
