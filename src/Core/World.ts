import {Entity} from "./Entity";
import {IWorld} from "./IWorld";
import {InternalWorld} from "./InternalWorld";
import {System} from "./System";

export class World implements IWorld {
    private readonly _internalWorld: IWorld;

    constructor() {
        this._internalWorld = new InternalWorld();
    }

    public EntityBuilder() {
        return this._internalWorld.EntityBuilder();
    }

    public DestroyEntity(entity: Entity) {
        this._internalWorld.DestroyEntity(entity);
    }

    public GetEntity(entityId: number): Entity {
        return this._internalWorld.GetEntity(entityId);
    }

    public RegisterSystem(system: {new (world: IWorld): System}) {
        return this._internalWorld.RegisterSystem(system);
    }
}
