import {Entity} from "../Entity";
import {ComponentCtor} from '../Component';

export abstract class Condition {
    public Components: ReadonlyArray<ComponentCtor<unknown>>;

    constructor(...components: ComponentCtor<unknown>[]) {
        this.Components = components;
    }

    public get ComponentsId() {
        return this.Components.map(c => c.Id);
    }

    public abstract Evaluate(entity: Entity): boolean;
    public abstract Hash(): string;
}
