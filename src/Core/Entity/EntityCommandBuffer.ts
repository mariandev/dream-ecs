import {EntityId} from "./Entity";
import {ComponentCtor, ComponentId, ComponentValue} from "../Component";
import {InternalWorld, IWorldNewEntityReturnType} from "../World";

export class EntityCommandBuffer {
    private _components: {[entityId: number/*EntityId*/]: {add: {[componentId: number/*ComponentId*/]: unknown}, remove: ComponentId[]}} = {};

    private _createEntity: (IWorldNewEntityReturnType["Create"])[] = [];
    private _removeEntity: EntityId[] = [];

    constructor(private readonly _world: InternalWorld) {}

    public AddComponent<T extends ComponentCtor<unknown>>(entityId: EntityId, component: T, value: ComponentValue<T>): this {
        if(typeof this._components[entityId] === "undefined") this._components[entityId] = {add: {}, remove: []};

        this._components[entityId].add[component.Id] = value;

        return this;
    }
    public RemoveComponent<T extends ComponentCtor<unknown>>(entityId: EntityId, component: T): this {
        if(typeof this._components[entityId] === "undefined") this._components[entityId] = {add: {}, remove: []};

        this._components[entityId].remove.push(component.Id);
        return this;
    }

    public CreateEntity(): Omit<IWorldNewEntityReturnType, "Create"> {
        const {Create, ...others} = this._world.EntityBuilder();

        this._createEntity.push(Create);

        return others;
    }
    public RemoveEntity(entityId: EntityId) {
        this._removeEntity.push(entityId);
    }

    public Execute() {
        for(const entityId of Object.keys(this._components)) {
            const entity = this._world.GetEntity(parseInt(entityId, 10));

            let components = this._components[entityId];
            for(const removeComponentId of components.remove) {
                entity.RemoveComponent(removeComponentId);
            }

            for(const [addComponentId, value] of Object.entries(components.add)) {
                entity.AddComponent(parseInt(addComponentId, 10), value);
            }
        }

        for(let i = 0;i < this._createEntity.length; i++) {
            this._createEntity[i]();
        }

        for(let i = 0;i < this._removeEntity.length; i++) {
            this._world.RemoveEntity(this._world.GetEntity(this._removeEntity[i]));
        }
    }
}
