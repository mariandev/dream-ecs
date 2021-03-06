import {Condition} from "./Condition";
import {Entity} from "../Entity";

export class Any extends Condition {
    protected conditions: Condition[];
    constructor(...conditions: Condition[]) {
        super(...conditions.map(c => c.Components).reduce((a, v) => [...a, ...v], []));
        this.conditions = conditions;
    }

    Evaluate(entity: Entity): boolean {
        return this.conditions.find(c => c.Evaluate(entity)) != null;
    }

    Hash(): string {
        return `Any(${this.conditions.map(c => c.Hash()).join(", ")})`;
    }

}
