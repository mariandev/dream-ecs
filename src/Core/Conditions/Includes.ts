import {Condition} from "./Condition";
import {Entity} from "../Entity/Entity";

export class Includes extends Condition {
    Evaluate(entity: Entity): boolean {
        return this.components.every(c => entity.AttachedComponents.has(c.name));
    }

    Hash() {
        return `Includes(${this.components.map(c => c.name).join(", ")})`;
    }
}
