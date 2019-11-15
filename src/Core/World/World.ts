import {Entity} from "../Entity";
import {IWorld, IWorldNewEntityReturnType} from "./IWorld";
import {InternalWorld} from "./InternalWorld";
import {Query, QueryConditions, System} from "../System";

export class World implements IWorld {
    public static Active: World = null;

    private readonly _internalWorld: InternalWorld = new InternalWorld();

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

    public static RegisterSystem(world: World = World.Active) {
        return function(ctor) {
            world.RegisterSystem(ctor);
            world._internalWorld.DependencyTreeForSystems.AddElement(ctor);
        };
    }

    public static ExecuteAfter(after: Function, world: World = World.Active) {
        return function(ctor: Function) {
            world._internalWorld.DependencyTreeForSystems.AddDependency(after, ctor);
        }
    }

    public static ExecuteBefore(before: Function, world: World = World.Active) {
        return function(ctor: Function) {
            world._internalWorld.DependencyTreeForSystems.AddDependency(ctor, before);
        }
    }
}
