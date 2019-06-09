import {Component, Condition, Includes, JustAdded, JustRemoved, System, TagComponent} from "../Core";
import {EntityCommandBuffer} from "../Core/EntityCommandBuffer";
import {DOMElementComponent} from "./DOMElement";
import {All, Any} from "../Base/Conditions";

export class DOMTrackClickComponent extends Component<{capture?: boolean, stopPropagation?: boolean, preventDefault?: boolean}> {
    constructor({capture = false, stopPropagation = false, preventDefault = false} = {}) {
        super({capture, stopPropagation, preventDefault})
    }
}
export class DOMClickedComponent extends Component<MouseEvent> {}
export class DOMClickListenerComponent extends Component<{listener: (e: MouseEvent) => void}> {}

export class DOMTrackClickEventSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Any(
                new All(
                    new Includes(DOMElementComponent),
                    new JustAdded(DOMTrackClickComponent)
                ),
                new All(
                    new JustAdded(DOMElementComponent),
                    new Includes(DOMTrackClickComponent)
                )
            )
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for (const entity of this.GetEntities()) {
            const el = entity.GetComponent(DOMElementComponent).Value;
            const config = entity.GetComponent(DOMTrackClickComponent).ValueUnsafe;

            const listener = (e: MouseEvent) => {
                if(config.stopPropagation) e.stopPropagation();
                if(config.preventDefault) e.preventDefault();
                entity.AddComponent(new DOMClickedComponent(e));
            };

            ecb.AddComponent(entity.Id, new DOMClickListenerComponent({listener}));

            el.addEventListener("click", listener, config.capture);
        }
    }
}

export class DOMUntrackClickEventSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Includes(DOMElementComponent),
            new Includes(DOMClickListenerComponent),
            new JustRemoved(DOMTrackClickComponent)
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for (const entity of this.GetEntities()) {
            const el = entity.GetComponent(DOMElementComponent).Value;
            const listener = entity.GetComponent(DOMClickListenerComponent).Value.listener;

            el.removeEventListener("click", listener);
            el.removeEventListener("click", listener, true);

            ecb
                .RemoveComponent(entity.Id, DOMClickedComponent.constructor.name)
                .RemoveComponent(entity.Id, DOMClickListenerComponent.constructor.name);
        }
    }
}
