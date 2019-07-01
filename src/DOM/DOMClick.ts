import {Any, Component, Condition, Includes, JustAdded, JustRemoved, System, TagComponent} from "../Core";
import {EntityCommandBuffer} from "../Core/Entity";
import {DOMElementComponent} from "./DOMElement";

export const DOMTrackClickComponent = TagComponent.new();
export const DOMTrackClickUseCaptureComponent = TagComponent.new();
export const DOMTrackClickStopPropagationComponent = TagComponent.new();
export const DOMTrackClickPreventDefaultComponent = TagComponent.new();
export const DOMClickedComponent = Component.new<MouseEvent>()
export const DOMClickListenerComponent = Component.new<(e: MouseEvent) => void>();

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
