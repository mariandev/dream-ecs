import {Entity} from "../Entity";
import {ComponentCtor} from '../Component';

export abstract class Condition {
    public components: ComponentCtor<unknown>[];

    constructor(...components: ComponentCtor<unknown>[]) {
        this.components = components;
    }

    public get ComponentsName() {
        return this.components.map(c => c.name);
    }

    public abstract Evaluate(entity: Entity): boolean;
    public abstract Hash(): string;
}
