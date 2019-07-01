import {Condition} from "./index";
import {Entity} from "../index";

export class All extends Condition {
    protected conditions: Condition[];
    constructor(...conditions: Condition[]) {
        super(...conditions.flatMap(c => c.components));
        this.conditions = conditions;
    }

    Evaluate(entity: Entity): boolean {
        return this.conditions.every(c => c.Evaluate(entity));
    }

    Hash(): string {
        return `All(${this.conditions.map(c => c.Hash()).join(", ")})`;
    }

}
