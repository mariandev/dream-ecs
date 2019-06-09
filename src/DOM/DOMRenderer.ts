import {Component, Condition, Entity, Includes, JustAdded, System} from "../Core";
import {Any, Parent} from "../Base/Conditions";
import {EntityCommandBuffer} from "../Core/EntityCommandBuffer";
import {DOMElementComponent} from "./DOMElement";
import {ParentComponent, PositionComponent, SizeComponent} from "../Base/Components";

export class DOMRendererComponent extends Component<keyof HTMLElementTagNameMap> {}

export class DOMRendererSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Parent(new Includes(DOMElementComponent)),
            new Includes(DOMRendererComponent),
            new Includes(PositionComponent),
            new Includes(SizeComponent),
            new Any(
                new Parent(new JustAdded(DOMElementComponent)),
                new JustAdded(DOMRendererComponent),
                new JustAdded(PositionComponent),
                new JustAdded(SizeComponent),
            ),
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for(const entity of this.GetEntities()) {
            const el = this.GetDOMElement(entity, ecb);

            this.SetPosition(entity, el);
            this.SetSize(entity, el);

            el.style.outline = "1px solid red";
        }
    }

    private GetDOMElement(entity: Entity, ecb: EntityCommandBuffer): HTMLElement {
        const elComp = entity.GetComponent(DOMElementComponent);

        if (elComp) {
            return elComp.Value;
        } else {
            const elDef = entity.GetComponent(DOMRendererComponent).Value;
            const parent = entity.GetComponent(ParentComponent).Value;
            const parentEl = parent.GetComponent(DOMElementComponent).Value;

            const el = document.createElement(elDef);
            parentEl.appendChild(el);

            ecb.AddComponent(entity.Id, new DOMElementComponent(el));

            return el;
        }
    }

    private SetPosition(entity: Entity, el: HTMLElement) {
        const position = entity.GetComponent(PositionComponent).Value;

        el.style.position = "absolute";
        el.style.left = position.x + "px";
        el.style.top = position.y + "px";
    }

    private SetSize(entity: Entity, el: HTMLElement) {
        const size = entity.GetComponent(SizeComponent).Value;

        el.style.width = size.x + "px";
        el.style.height = size.y + "px";
    }
}
