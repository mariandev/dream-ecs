import {Entity} from "../Entity";

export abstract class Condition {
    public components: Function[];

    constructor(...components: Function[]) {
        this.components = components;
    }

    public get ComponentsName() {
        return this.components.map(c => c.name);
    }

    public abstract Evaluate(entity: Entity): boolean;
    public abstract Hash(): string;
}
