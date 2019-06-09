import {Entity, EntityId} from "./Entity";
import {System} from "./System";
import {Component} from "./Component";

export interface IWorld {
    CreateEntity(...components: Component<any>[]): Entity;
    DestroyEntity(entity: Entity): void;
    GetEntity(entityId: EntityId): Entity;

    RegisterSystem(system: {new (world: IWorld): System}): void;
}
