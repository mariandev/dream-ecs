import {EntityId} from "./Entity";
import {Archetype, Component, ComponentCtor, ComponentId, ComponentValue} from "../Component";
import {InternalWorld, IWorldNewEntityReturnType} from "../World";


// TODO: Create a separate class that exposes the ECB public method that the systems are using (PublicEntityCommandBuffer). An instance of the class should be received by calling a method on the ECB
export class EntityCommandBuffer {
    private _components: {[id: number/*EntityId*/]: {set: Set<ComponentId>, values: {[componentId: number/*ComponentId*/]: (number | bigint)}}} = {};

    private _createEntity: (IWorldNewEntityReturnType["Create"])[] = [];
    private _removeEntity: EntityId[] = [];

    constructor(private readonly _world: InternalWorld) {}

    public AddComponent<T extends ComponentCtor>(entityId: EntityId,
                                                 component: T,
                                                 value: ComponentValue<T> = undefined): this {
        const store = this._components[entityId];
        if(store) {
            store.set.add(component.Id);
            store.values[component.Id] = value;
        } else {
            const set = new Set(this._world.GetEntity(entityId).Archetype);
            set.add(component.Id);
            this._components[entityId] = {
                set,
                values: {
                    [component.Id]: value
                }
            };
        }

        return this;
    }
    public RemoveComponent<T extends ComponentCtor>(entityId: EntityId, component: T): this {
        const store = this._components[entityId];
        if(store) {
            store.set.delete(component.Id);
        } else {
            const set = new Set(this._world.GetEntity(entityId).Archetype);
            set.delete(component.Id);
            this._components[entityId] = {
                set,
                values: {}
            };
        }

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
        for(const entityIdString of Object.keys(this._components)) {
            const entityId = parseInt(entityIdString);
            const component = this._components[entityIdString];
            let entity = this._world.GetEntity(entityId);
            let archetype = entity.Archetype;

            if(!archetype.EqualsWithArray(component.set)) {
                const newArchetype = Archetype.fromSet(component.set);
                this._world.DataStorage.TransferData(entityId, archetype, newArchetype);
                archetype = newArchetype;

                for(const componentId of entity.Archetype.Diff(newArchetype)) {
                    entity.AnnounceAddComponent(componentId);
                }

                for(const componentId of newArchetype.Diff(entity.Archetype)) {
                    entity.AnnounceRemoveComponent(componentId);
                }

                entity.Archetype = newArchetype;
            }

            for(const componentId of component.set) {
                this._world.DataStorage.SetComponentData(
                  entityId,
                  archetype,
                  Component.IdToComponent[componentId],
                  component.values[componentId]
                );
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
