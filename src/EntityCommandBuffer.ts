import {EntityId} from "./Entity";
import {Component, ComponentName} from "./Component";
import {IWorld} from "./IWorld";

export class EntityCommandBuffer {
    private _addComponent: {ids: EntityId[], components: Component[]} = {
        ids: [],
        components: []
    };
    private _removeComponent: {ids: EntityId[], components: ComponentName[]} = {
        ids: [],
        components: []
    };

    constructor(private readonly _world: IWorld) {}

    public AddComponent(entityId: EntityId, component: Component): this {
        this._addComponent.ids.push(entityId);
        this._addComponent.components.push(component);
        return this;
    }
    public RemoveComponent(entityId: EntityId, component: ComponentName): this {
        this._removeComponent.ids.push(entityId);
        this._removeComponent.components.push(component);
        return this;
    }

    public Execute() {
        for(let i = 0;i < this._addComponent.ids.length; i++) {
            this._world
                .GetEntity(this._addComponent.ids[i])
                .__AddComponent(this._addComponent.components[i]);
        }

        for(let i = 0;i < this._removeComponent.ids.length; i++) {
            this._world
                .GetEntity(this._removeComponent.ids[i])
                .__RemoveComponent(this._removeComponent.components[i])
        }
    }

    public GetAddedComponents(): Iterable<Component> {
        return this._addComponent.components.values();
    }

    public GetRemovedComponents(): Iterable<ComponentName> {
        return this._removeComponent.components.values();
    }

    public Clear() {
        this._addComponent.ids.length = 0;
        this._addComponent.components.length = 0;

        this._removeComponent.ids.length = 0;
        this._removeComponent.components.length = 0;
    }
}
