import {Query, QueryConditions} from "./Query";
import {InternalWorld} from "./InternalWorld";
import {EntityCommandBuffer} from "./EntityCommandBuffer";

export abstract class System {
    public readonly Query: Query;

    constructor(private readonly _world: InternalWorld) {
        this.Query = this._world.CreateQuery(this.QueryConditions());
    }

    protected get dt() {
        return this._world.dt;
    }

    public GetEntities() {
        return this._world.GetEntitiesForQuery(this.Query);
    }

    public abstract QueryConditions(): QueryConditions;
    public abstract Execute(ecb: EntityCommandBuffer);
}
