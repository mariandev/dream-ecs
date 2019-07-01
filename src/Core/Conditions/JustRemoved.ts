import {Condition} from "./Condition";
import {Entity} from "../Entity";

export class JustRemoved extends Condition {
    Evaluate(entity: Entity): boolean {
        return this.components.every(c => entity.JustRemovedComponents.now.has(c.Id));
    }

    Hash() {
        return `JustRemoved(${this.components.map(c => c.Id).join(", ")})`;
    }
}
