import {Entity} from "../Entity";
import {SingleComponentCondition} from "./SingleComponentCondition";

export class Excludes extends SingleComponentCondition {
    Evaluate(entity: Entity): boolean {
        return !entity.HasComponent(this._component);
    }

    Hash() {
        return `Excludes(${this.Components.map(c => c.Id).join(", ")})`;
    }
}
