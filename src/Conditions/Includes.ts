import {Condition} from "./Condition";
import {Entity} from "../Entity";

export class Includes extends Condition {
    Evaluate(entity: Entity): boolean {
        return entity.AttachedComponents.has(this.component.name);
    }

    Hash() {
        return `Includes(${this.component.name})`;
    }
}
