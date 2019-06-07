import {Condition} from "./Condition";
import {Entity} from "../Entity";

export class Excludes extends Condition {
    Evaluate(entity: Entity): boolean {
        return !entity.AttachedComponents.has(this.component.name);
    }

    Hash() {
        return `Excludes(${this.component.name})`;
    }
}
