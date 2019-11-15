import {Condition} from "./Condition";
import {Entity} from "../Entity";

export class All extends Condition {
    protected conditions: Condition[];
    constructor(...conditions: Condition[]) {
        super(...conditions.map(c => c.Components).reduce((a, v) => [...a, ...v], []));
        this.conditions = conditions;
    }

    Evaluate(entity: Entity): boolean {
        return this.conditions.every(c => c.Evaluate(entity));
    }

    Hash(): string {
        return `All(${this.conditions.map(c => c.Hash()).join(", ")})`;
    }

}
