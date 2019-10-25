import {Query, QueryConditions} from "./Query";
import {InternalWorld} from "../World";
import {Entity, EntityCommandBuffer, EntityId} from "../Entity";
import {Condition} from "../Conditions";
import {Archetype, Component, ComponentCtor, ComponentId, ComponentValue} from "../Component";
import {ArchetypeStore} from "../Component/DataStorage";

export abstract class System {
    public readonly Query: Query;

    public readonly Stores = new Map<Archetype, ArchetypeStore>();

    constructor(public readonly _world: InternalWorld) {
        this.Query = this._world.CreateQuery(this.QueryConditions());
    }

    public get dt() {
        return this._world.dt;
    }

    public GetArchetypes() {
        return this._world.GetArchetypesForQuery(this.Query);
    }

    public *GetEntities(): Iterable<EntityId> {
        for(const archetype of this.GetArchetypes()) {
            const store = this._world.DataStorage.GetStoreForArchetype(archetype);
            const view = store.entity;
            for(let i = 0;i < view.length; i++) {
                yield view[i];
            }
        }
    }

    public *GetComponentData(component: typeof Component): Iterator<ComponentValue<typeof Component>> {
        for(const archetype of this.GetArchetypes()) {
            const store = this._world.DataStorage.GetStoreForArchetype(archetype);

            const view = store[component.Id];

            for(let i = 0;i < view.length; i++) {
                yield view[i];
            }
        }
    }

    public GetEntitiesV2(callback: (entityId: EntityId) => void) {
        for(const archetype of this.GetArchetypes()) {
            const store = this._world.DataStorage.GetStoreForArchetype(archetype);
            const view = store.entity;
            const viewLength = view.length;
            for(let i = 0; i < viewLength; i++) {
                callback(view[i]);
            }
        }
    }

    public abstract QueryConditions(): QueryConditions;
    public abstract Execute(ecb: EntityCommandBuffer);

    public static new(name: string,
                      query: QueryConditions,
                      execute: (this: System, ecb: EntityCommandBuffer) => void) {
        const ctor = class extends System {
            QueryConditions(): ReadonlyArray<Condition> {
                return query;
            }

            Execute(ecb: EntityCommandBuffer) {
                execute.call(this, ecb);
            }
        };

        Object.defineProperty(ctor, "name", {
            value: name,
            configurable: true,
            writable: false,
            enumerable: false
        });

        return ctor;
    }
}
