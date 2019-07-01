import {Condition} from "./Condition";
import {Entity} from "../Entity/Entity";

export class JustAdded extends Condition {
    Evaluate(entity: Entity): boolean {
        return this.components.every(c => entity.JustAddedComponents.now.has(c.name));
    }

    Hash() {
        return `JustAdded(${this.components.map(c => c.name).join(", ")})`;
    }
}
