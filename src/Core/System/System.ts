import {Query, QueryConditions} from "./Query";
import {InternalWorld} from "../World/InternalWorld";
import {EntityCommandBuffer} from "../Entity/EntityCommandBuffer";
import {Entity, EntityId} from "../Entity";

type QueryMap = { [query: string]: Query };

type QueryExecute<T extends QueryMap = {}> = (this: System<T>, ecb: EntityCommandBuffer) => void;
type QueryGetQueries<T extends QueryMap = {}> = () => T;

export abstract class System<T extends QueryMap = {}> {
    public abstract Queries: T;

    constructor(private readonly _world: InternalWorld) {}

    public get dt() {
        return this._world.dt;
    }

    public *GetEntities(query: Query): IterableIterator<Entity> {
        const entities = this._world.GetEntitiesForQuery(query);
        const entitiesCount = entities.length;

        for(let i = 0;i < entitiesCount;i++) {
            yield this._world.GetEntity(entities[i]);
        }
    }

    public GetEntityIds(query: Query) {
        return this._world.GetEntitiesForQuery(query);
    }

    public GetEntity(entityId: EntityId): Entity {
        return this._world.GetEntity(entityId);
    }

    public abstract Execute(ecb: EntityCommandBuffer);
}
