import {Query, QueryConditions} from "./Query";
import {InternalWorld} from "../World/InternalWorld";
import {EntityCommandBuffer} from "../Entity/EntityCommandBuffer";
import {EntityId} from "../Entity";

type QueryMap = { [query: string]: Query };

type QueryExecute<T extends QueryMap = {}> = (this: System<T>, ecb: EntityCommandBuffer) => void;
type QueryGetQueries<T extends QueryMap = {}> = () => T;

export abstract class System<T extends QueryMap = {}> {
    public readonly Queries: T;

    constructor(private readonly _world: InternalWorld) {
        this.Queries = this.GetQueries();
    }

    public get dt() {
        return this._world.dt;
    }

    public *GetEntities(query: Query) {
        const entities = this._world.GetEntitiesForQuery(query);
        const entitiesCount = entities.length;

        for(let i = 0;i < entitiesCount;i++) {
            yield this._world.GetEntity(entities[i]);
        }
    }

    public GetEntityIds(query: Query) {
        return this._world.GetEntitiesForQuery(query);
    }

    public GetEntity(entityId: EntityId) {
        return this._world.GetEntity(entityId);
    }

    protected abstract GetQueries(): T;
    public abstract Execute(ecb: EntityCommandBuffer);

    public static new<T extends QueryMap = {}>(name: string,
                                               execute: QueryExecute<T>);
    public static new<T extends QueryMap = {}>(name: string,
                                               getQueries: T,
                                               execute: QueryExecute<T>);
    public static new<T extends QueryMap = {}>(name: string,
                                               queriesOrExecute: T | QueryExecute<T>,
                                               executeMaybe?: QueryExecute<T>) {

        const queries = typeof executeMaybe === "undefined" ? {} as T : (queriesOrExecute as T);
        const execute = typeof executeMaybe === "undefined" ? queriesOrExecute as QueryExecute<T> : executeMaybe;

        const ctor = class extends System<T> {
            GetQueries(): T {
                return queries;
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
