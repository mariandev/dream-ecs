import {Archetype, ComponentCtor, ComponentId, ComponentValue} from "../Component";
import {InternalWorld} from "../World";

export class Entity {
    public readonly Id = EntityIdGen.Gen;

    public readonly Components = new Map<ComponentId, number>();

    public Archetype = new Archetype();

    public readonly JustAddedComponents = {
        now: new Set<number>(),
        next: new Set<number>()
    };

    public readonly JustRemovedComponents = {
        now: new Set<number>(),
        next: new Set<number>()
    };

    constructor(private readonly _world: InternalWorld) {}

    public AddComponent<T extends ComponentCtor>(component: T, value: ComponentValue<T>): this {
        const alreadyHadTheComponent = this.Archetype.HasComponent(component.Id);

        this.__AddComponent<T>(component, value);

        if(alreadyHadTheComponent) this._world.OnComponentAdded(this, component);

        return this;
    }
    public RemoveComponent<T extends ComponentCtor>(component: T): this {
        if(!this.Archetype.HasComponent(component.Id)) return this;

        this.__RemoveComponent(component);

        this._world.OnComponentRemoved(this, component);

        return this;
    }

    public __AddComponent<T extends ComponentCtor>(component: T, value: ComponentValue<T>) {
        this.Components[component.Id] = value;

        this.JustAddedComponents.next.add(component.Id);
    }
    public __RemoveComponent(component: ComponentCtor) {
        delete this.Components[component.Id];

        this.JustRemovedComponents.next.add(component.Id);
    }

    public GetComponent<T extends ComponentCtor>(component: T) {
        return this.Components[component.Id] as ComponentValue<T>;
    }

    public RecalculateArchetype() {
        const newSet = new Set<ComponentId>(this.Archetype);

        for (const componentId of this.JustAddedComponents.next.values()) {
            newSet.add(componentId);
        }

        for (const componentId of this.JustRemovedComponents.next.values()) {
            newSet.delete(componentId);
        }

        this.Archetype = new Archetype(newSet);
    }

    public AdvanceToNextStep() {
        this.RecalculateArchetype();

        this.JustAddedComponents.now = this.JustAddedComponents.next;
        this.JustAddedComponents.next = new Set();

        this.JustRemovedComponents.now = this.JustRemovedComponents.next;
        this.JustRemovedComponents.next = new Set();
    }
}

export type EntityId = number;
class EntityIdGen {
    private static _id = 0;
    public static get Gen(): EntityId {
        return EntityIdGen._id++;
    }
}
