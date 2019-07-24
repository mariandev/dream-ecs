import {Condition} from "./Condition";
import {Entity} from "../Entity";

export class Excludes extends Condition {
    Evaluate(entity: Entity): boolean {
        return this.components.every(c => !entity.Archetype.HasComponent(c.Id));
    }

    Hash() {
        return `Excludes(${this.components.map(c => c.Id).join(", ")})`;
    }
}
