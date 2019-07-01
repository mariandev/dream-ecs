import {Any, Component, Condition, Includes, JustAdded, System} from "../Core";
import {DOMElementComponent} from "./DOMElement";
import {EntityCommandBuffer} from "../Core/Entity";

export const DOMElementIdComponent = Component.new<string>();

export class DOMElementIdSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Includes(DOMElementComponent),
            new Includes(DOMElementIdComponent),
            new Any(
                new JustAdded(DOMElementComponent),
                new JustAdded(DOMElementIdComponent),
            )
        ];
    }


    Execute(ecb: EntityCommandBuffer) {
        for(const entity of this.GetEntities()) {
            const el = entity.GetComponent(DOMElementComponent);
            const id = entity.GetComponent(DOMElementIdComponent);

            el.setAttribute("id", id);
        }
    }
}
