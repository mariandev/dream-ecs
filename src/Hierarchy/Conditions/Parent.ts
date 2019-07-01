import {Condition, Entity} from "../../Core";
import {ParentComponent} from "../Components";

export class Parent extends Condition {
    constructor(protected condition: Condition) {
        super(...condition.components);
    }

    Evaluate(entity: Entity): boolean {
        return entity.HasComponent(ParentComponent) && this.condition.Evaluate(entity.GetComponent(ParentComponent) as any);
    }

    Hash(): string {
        return `Parent(${this.condition.Hash()})`;
    }
}
