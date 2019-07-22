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

    constructor(private readonly _world: InternalWorld) {}

    public AddComponent<T extends ComponentCtor>(component: T, value: ComponentValue<T>): this {
        const alreadyHadTheComponent = this.HasComponent(component);

        this.__AddComponent<T>(component, value);

        if(alreadyHadTheComponent) this._world.OnComponentAdded(this, component);

        return this;
    }
    public RemoveComponent<T extends ComponentCtor>(component: T): this {
        if(typeof this.Components[component.Id] === "undefined") return this;

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

    public HasComponent<T extends ComponentCtor>(component: T): boolean {
        return typeof this.Components[component.Id] !== "undefined";
    }
    public GetComponent<T extends ComponentCtor>(component: T) {
        return this.Components[component.Id] as ComponentValue<T>;
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
    private static _id = 0;
    public static get Gen(): EntityId {
        return EntityIdGen._id++;
    }
}