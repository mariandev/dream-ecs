import {Entity} from "../Entity";
import {SingleComponentCondition} from "./SingleComponentCondition";

export class JustRemoved extends SingleComponentCondition {
    Evaluate(entity: Entity): boolean {
        return entity.JustRemovedComponents.now.has(this._component.Id);
    }

    Hash() {
        return `JustRemoved(${this.Components.map(c => c.Id).join(", ")})`;
    }
}
