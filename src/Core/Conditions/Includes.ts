import {Entity} from "../Entity";
import {SingleComponentCondition} from "./SingleComponentCondition";

export class Includes extends SingleComponentCondition {
    Evaluate(entity: Entity): boolean {
        return entity.HasComponent(this._component);
    }

    Hash() {
        return `Includes(${this.Components.map(c => c.Id).join(", ")})`;
    }
}
