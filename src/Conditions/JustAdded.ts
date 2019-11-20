import {Entity} from "../Entity";
import {SingleComponentCondition} from "./SingleComponentCondition";

export class JustAdded extends SingleComponentCondition {
    Evaluate(entity: Entity): boolean {
        return entity.JustAddedComponents.now.has(this._component.Id);
    }

    Hash() {
        return `JustAdded(${this.Components.map(c => c.Id).join(", ")})`;
    }
}
