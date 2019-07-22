import {Entity} from "../Entity";
import {ComponentCtor} from '../Component';

export abstract class Condition {
    public components: ComponentCtor[];

    constructor(...components: ComponentCtor[]) {
        this.components = components;
    }

    public get ComponentsName() {
        return this.components.map(c => c.Id);
    }

    public abstract Evaluate(entity: Entity): boolean;
    public abstract Hash(): string;
}
