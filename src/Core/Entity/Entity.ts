import {Archetype, ComponentCtor, ComponentId, ComponentValue} from "../Component";

export class Entity {
    public readonly Id = EntityIdGen.Gen;

    public Archetype = new Archetype();

    public readonly JustAddedComponents = {
        now: new Set<number>(),
        next: new Set<number>()
    };

    public readonly JustRemovedComponents = {
        now: new Set<number>(),
        next: new Set<number>()
    };

    public AnnounceAddComponent(componentId: ComponentId) {
			this.JustAddedComponents.next.add(componentId);
    }
    public AnnounceRemoveComponent(componentId: ComponentId) {
        this.JustRemovedComponents.next.add(componentId);
    }

    public AdvanceToNextStep() {
        this.JustAddedComponents.now = this.JustAddedComponents.next;
        this.JustAddedComponents.next = new Set();

        this.JustRemovedComponents.now = this.JustRemovedComponents.next;
        this.JustRemovedComponents.next = new Set();
    }
}

export type EntityId = number;
class EntityIdGen {
    private static _id = 1;
    public static get Gen(): EntityId {
        return EntityIdGen._id++;
    }
}
