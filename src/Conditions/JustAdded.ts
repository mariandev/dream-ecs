import {Condition} from "./Condition";
import {Entity} from "../Entity";

export class JustAdded extends Condition {
    Evaluate(entity: Entity): boolean {
        return entity.JustAddedComponents.now.has(this.component.name);
    }

    Hash() {
        return `JustAdded(${this.component.name})`;
    }
}
