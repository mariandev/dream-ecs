import {Component, Condition, Includes, JustAdded, System} from "../Core";
import {DOMElementComponent} from "./DOMElement";
import {Any} from "../Base/Conditions";
import {EntityCommandBuffer} from "../Core/EntityCommandBuffer";

export class DOMElementIdComponent extends Component<string> {}

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
            const el = entity.GetComponent(DOMElementComponent).Value;
            const id = entity.GetComponent(DOMElementIdComponent).Value;

            el.setAttribute("id", id);
        }
    }
}
