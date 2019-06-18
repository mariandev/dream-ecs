import {Component, Condition, Includes, JustAdded, JustRemoved, System, TagComponent} from "../Core";
import {EntityCommandBuffer} from "../Core/EntityCommandBuffer";
import {DOMElementComponent} from "./DOMElement";
import {All, Any} from "../Base/Conditions";

export class DOMTrackClickComponent extends TagComponent {}
export class DOMTrackClickUseCaptureComponent extends TagComponent {}
export class DOMTrackClickStopPropagationComponent extends TagComponent {}
export class DOMTrackClickPreventDefaultComponent extends TagComponent {}
export class DOMClickedComponent extends Component<MouseEvent> {}
export class DOMClickListenerComponent extends Component<(e: MouseEvent) => void> {}

export class DOMTrackClickEventSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Includes(DOMElementComponent),
            new Includes(DOMTrackClickComponent),
            new Any(
                new JustAdded(DOMElementComponent),
                new JustAdded(DOMTrackClickComponent),
            )
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for (const entity of this.GetEntities()) {
            const el = entity.GetComponent(DOMElementComponent);

            const stopPropagation = entity.HasComponent(DOMTrackClickStopPropagationComponent);
            const preventDefault = entity.HasComponent(DOMTrackClickPreventDefaultComponent);
            const useCapture = entity.HasComponent(DOMTrackClickUseCaptureComponent);

            const listener = (e: MouseEvent) => {
                if(stopPropagation) e.stopPropagation();
                if(preventDefault) e.preventDefault();
                entity.AddComponent(DOMClickedComponent, e);
            };

            ecb.AddComponent(entity.Id, DOMClickListenerComponent, listener);

            el.addEventListener("click", listener, useCapture);
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
            const el = entity.GetComponent(DOMElementComponent);
            const listener = entity.GetComponent(DOMClickListenerComponent);

            el.removeEventListener("click", listener);
            el.removeEventListener("click", listener, true);

            ecb
                .RemoveComponent(entity.Id, DOMClickedComponent)
                .RemoveComponent(entity.Id, DOMClickListenerComponent);
        }
    }
}
