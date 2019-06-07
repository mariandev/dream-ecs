import {Entity} from "../Entity";

export abstract class Condition {
    constructor(public component: Function) { }

    public get ComponentName() {
        return this.component.name;
    }

    public abstract Evaluate(entity: Entity): boolean;
    public abstract Hash(): string;
}
