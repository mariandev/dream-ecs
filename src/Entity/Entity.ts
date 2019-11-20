import {ComponentCtor, ComponentId, ComponentValue} from "../Component";
import {InternalWorld} from "../World";

export class Entity {
    public readonly Id = EntityIdGen.Gen;

    public readonly Components = new Map<ComponentId, unknown>();

    public readonly JustAddedComponents: {
        now: Set<ComponentId>,
        next: Set<ComponentId>
    } = {
        now: new Set(),
        next: new Set()
    };

    public readonly JustRemovedComponents: {
        now: Set<ComponentId>,
        next: Set<ComponentId>
    } = {
        now: new Set(),
        next: new Set()
    };

    public AddComponent(componentId: ComponentId, value: unknown) {
        this.Components[componentId] = value;

        this.JustAddedComponents.next.add(componentId);
    }
    public RemoveComponent(componentId: ComponentId) {
        delete this.Components[componentId];

        this.JustRemovedComponents.next.add(componentId);
    }

    public HasComponent<T extends ComponentCtor<unknown>>(component: T): boolean {
        return typeof this.Components[component.Id] !== "undefined";
    }
    public GetComponent<T extends ComponentCtor<unknown>>(component: T) {
        return this.Components[component.Id] as ComponentValue<T>;
    }

    public AdvanceToNextStep() {
        let tmp = this.JustAddedComponents.now;
        tmp.clear();

        this.JustAddedComponents.now = this.JustAddedComponents.next;
        this.JustAddedComponents.next = tmp;

        tmp = this.JustRemovedComponents.now;
        tmp.clear();

        this.JustRemovedComponents.now = this.JustRemovedComponents.next;
        this.JustRemovedComponents.next = tmp;
    }
}

export type EntityId = number;
class EntityIdGen {
    private static _id = 0;
    public static get Gen(): EntityId {
        return EntityIdGen._id++;
    }
}
