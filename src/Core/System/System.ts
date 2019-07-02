import {Query, QueryConditions} from "./Query";
import {InternalWorld} from "../World";
import {EntityCommandBuffer} from "../Entity";
import {Condition} from "../Conditions";

export abstract class System {
    public readonly Query: Query;

    constructor(public readonly _world: InternalWorld) {
        this.Query = this._world.CreateQuery(this.QueryConditions());
    }

    public get dt() {
        return this._world.dt;
    }

    public GetEntities() {
        return this._world.GetEntitiesForQuery(this.Query);
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
                return execute.call(this, ecb);
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
