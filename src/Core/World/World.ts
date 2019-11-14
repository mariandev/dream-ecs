import {Entity} from "../Entity";
import {IWorld, IWorldNewEntityReturnType} from "./IWorld";
import {InternalWorld} from "./InternalWorld";
import {Query, QueryConditions, System} from "../System";

export class World implements IWorld {
    public static Active: World = null;

    private readonly _internalWorld: IWorld = new InternalWorld();

    constructor() {
        if(World.Active == null) {
            World.Active = this;
        }
    }

    public EntityBuilder(): IWorldNewEntityReturnType {
        return this._internalWorld.EntityBuilder();
    }

    public GetEntity(entityId: number): Entity {
        return this._internalWorld.GetEntity(entityId);
    }

    public RegisterSystem(system: {new (world: IWorld): System}) {
        return this._internalWorld.RegisterSystem(system);
    }

    public CreateQuery(queryConditions: QueryConditions): Query {
        return this._internalWorld.CreateQuery(queryConditions);
    }

    public static RegisterSystem(world: IWorld = World.Active) {
        return function(ctor) {
            world.RegisterSystem(ctor);
        };
    }
}
