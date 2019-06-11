import {EntityId} from "./Entity";
import {Component, ComponentCtor, ComponentName, ComponentValue} from "./Component";
import {IWorld} from "./IWorld";

export class EntityCommandBuffer {
    private _addComponent: {ids: EntityId[], components: ComponentCtor<unknown>[], values: unknown[]} = {
        ids: [],
        components: [],
        values: []
    };
    private _removeComponent: {ids: EntityId[], components: ComponentCtor<unknown>[]} = {
        ids: [],
        components: []
    };

    constructor(private readonly _world: IWorld) {}

    public AddComponent<T extends ComponentCtor<unknown>>(entityId: EntityId, component: T, value: ComponentValue<T>): this {
        this._addComponent.ids.push(entityId);
        this._addComponent.components.push(component);
        this._addComponent.values.push(value);
        return this;
    }
    public RemoveComponent<T extends ComponentCtor<unknown>>(entityId: EntityId, component: T): this {
        this._removeComponent.ids.push(entityId);
        this._removeComponent.components.push(component);
        return this;
    }

    public Execute() {
        for(let i = 0;i < this._addComponent.ids.length; i++) {
            this._world
                .GetEntity(this._addComponent.ids[i])
                .__AddComponent(
                    this._addComponent.components[i],
                    this._addComponent.values[i]
                );
        }

        for(let i = 0;i < this._removeComponent.ids.length; i++) {
            this._world
                .GetEntity(this._removeComponent.ids[i])
                .__RemoveComponent(this._removeComponent.components[i])
        }
    }

    public GetAddedComponents(): Iterable<ComponentCtor<unknown>> {
        return this._addComponent.components.values();
    }

    public GetRemovedComponents(): Iterable<ComponentCtor<unknown>> {
        return this._removeComponent.components.values();
    }

    // public Clear() {
    //     this._addComponent.ids.length = 0;
    //     this._addComponent.components.length = 0;
    //
    //     this._removeComponent.ids.length = 0;
    //     this._removeComponent.components.length = 0;
    // }
}
