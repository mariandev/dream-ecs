import {Condition} from "./Condition";
import {Entity} from "../Entity";

export class Includes extends Condition {
    Evaluate(entity: Entity): boolean {
        return this.components.every(c => entity.HasComponent(c));
    }

    Hash() {
        return `Includes(${this.components.map(c => c.Id).join(", ")})`;
    }
}
