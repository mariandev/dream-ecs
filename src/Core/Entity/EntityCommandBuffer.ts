import {EntityId} from "./Entity";
import {ComponentCtor, ComponentId, ComponentValue, TagComponentCtor} from "../Component";
import {InternalWorld, IWorldNewEntityReturnType} from "../World";
import {Logger} from "../Logger";

export class EntityCommandBuffer {
    private _components: {[entityId: number/*EntityId*/]: {add: {[componentId: number/*ComponentId*/]: unknown}, remove: ComponentId[]}} = {};

    private _createEntity: (IWorldNewEntityReturnType["Create"])[] = [];
    private _removeEntity: EntityId[] = [];

    private _executed = false;

    constructor(protected readonly _world: InternalWorld) {}

    public AddComponent<T extends TagComponentCtor>(entityId: EntityId, component: T): this;
    public AddComponent<T extends ComponentCtor<unknown>>(entityId: EntityId, component: T, value: ComponentValue<T>): this
    public AddComponent<T extends ComponentCtor<unknown>>(entityId: EntityId, component: T, value?: ComponentValue<T>): this {
        if(this._executed) throw Logger.error(`Cannot add component "${component.Id}" with value "${value}" to entity "${entityId}", the ECB has already been executed`);

        if(typeof this._components[entityId] === "undefined") this._components[entityId] = {add: {}, remove: []};

        this._components[entityId].add[component.Id] = value;

        return this;
    }

    public RemoveComponent<T extends ComponentCtor<unknown>>(entityId: EntityId, component: T): this {
        if(this._executed) throw Logger.error(`Cannot remove component "${component.Id}" from entity "${entityId}", the ECB has already been executed`);

        if(typeof this._components[entityId] === "undefined") this._components[entityId] = {add: {}, remove: []};

        this._components[entityId].remove.push(component.Id);
        return this;
    }

    public CreateEntity(): Omit<IWorldNewEntityReturnType, "Create"> {
        if(this._executed) throw Logger.error(`Cannot create new entity, the ECB has already been executed`);

        const {Create, ...others} = this._world.EntityBuilder();

        this._createEntity.push(Create);

        return others;
    }

    public RemoveEntity(entityId: EntityId) {
        if(this._executed) throw Logger.error(`Cannot remove entity "${entityId}", the ECB has already been executed`);

        this._removeEntity.push(entityId);
    }

    public Execute() {
        this._executed = true;

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
