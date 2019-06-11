import {Component, ComponentCtor, ComponentName, ComponentValue} from "./Component";
import {InternalWorld} from "./InternalWorld";

export class Entity {
    public readonly Id = EntityIdGen.Gen;

    public readonly Components: {[component: string]: unknown} = {};
    public readonly AttachedComponents: Set<ComponentName> = new Set();

    public readonly JustAddedComponents: {
        now: Set<ComponentName>,
        next: Set<ComponentName>
    } = {
        now: new Set(),
        next: new Set()
    };

    public readonly JustRemovedComponents: {
        now: Set<ComponentName>,
        next: Set<ComponentName>
    } = {
        now: new Set(),
        next: new Set()
    };

    constructor(private readonly _world: InternalWorld) {}

    public AddComponent<T extends ComponentCtor<unknown>>(component: T, value: ComponentValue<T>): this {
        this.__AddComponent<T>(component, value);

        this._world.OnComponentAdded(this, component);

        return this;
    }
    public RemoveComponent<T extends ComponentCtor<unknown>>(component: T): this {
        if(typeof this.Components[component.name] === "undefined") return this;

        const componentValue = this.Components[component.name];

        this.__RemoveComponent(component);

        this._world.OnComponentRemoved(this, componentValue);

        return this;
    }

    public __AddComponent<T extends ComponentCtor<unknown>>(component: T, value: ComponentValue<T>) {
        this.AttachedComponents.add(component.name);
        this.Components[component.name] = value;

        this.JustAddedComponents.next.add(component.name);
    }
    public __RemoveComponent(component: ComponentCtor<unknown>) {
        this.AttachedComponents.delete(component.name);
        delete this.Components[component.name];

        this.JustRemovedComponents.next.add(component.name);
    }

    public HasComponent<T extends ComponentCtor<unknown>>(component: T): boolean {
        return typeof this.Components[component.name] !== "undefined";
    }
    public GetComponent<T extends ComponentCtor<unknown>>(component: T) {
        return this.Components[component.name] as any;
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
