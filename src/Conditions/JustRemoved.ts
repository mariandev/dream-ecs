import {Condition} from "./Condition";
import {Entity} from "../Entity";

export class JustRemoved extends Condition {
    Evaluate(entity: Entity): boolean {
        return entity.JustRemovedComponents.now.has(this.component.name);
    }

    Hash() {
        return `JustRemoved(${this.component.name})`;
    }
}
