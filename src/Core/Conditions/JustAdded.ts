import {Condition} from "./Condition";
import {Entity} from "../Entity";

export class JustAdded extends Condition {
    Evaluate(entity: Entity): boolean {
        return this.components.every(c => entity.JustAddedComponents.now.has(c.Id));
    }

    Hash() {
        return `JustAdded(${this.components.map(c => c.Id).join(", ")})`;
    }
}
