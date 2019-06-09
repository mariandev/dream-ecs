import {Component, ComponentName} from "./Component";
import {InternalWorld} from "./InternalWorld";

export class Entity {
    public readonly Id = EntityIdGen.Gen;

    public readonly Components: {[component: string]: Component<any>} = {};
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

    public AddComponent(component: Component<any>): this {
        this.__AddComponent(component);

        this._world.OnComponentAdded(this, component);

        return this;
    }
    public RemoveComponent(componentName: ComponentName): this {
        if(typeof this.Components[componentName] === "undefined") return this;

        const component = this.Components[componentName];

        this.__RemoveComponent(componentName);

        this._world.OnComponentRemoved(this, component);

        return this;
    }

    public __AddComponent(component: Component<any>) {
        this.AttachedComponents.add(component.constructor.name);
        this.Components[component.constructor.name] = component;

        this.JustAddedComponents.next.add(component.constructor.name);
    }

    public __RemoveComponent(componentName: ComponentName) {
        this.AttachedComponents.delete(componentName);
        delete this.Components[componentName];

        this.JustRemovedComponents.next.add(componentName);
    }

    public HasComponent(component: Function): boolean {
        return typeof this.Components[component.name] !== "undefined";
    }

    public GetComponent<T extends any>(component: T) {
        return this.Components[component.name] as (T extends {new (...args: any[]): Component<infer U>} ? Component<U> : any);
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
