export type ComponentName = string;
export class Component<T extends object = object> {
    constructor(public readonly Value: Readonly<T>) { }
}
