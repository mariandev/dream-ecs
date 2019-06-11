import {Entity, EntityId} from "./Entity";
import {System} from "./System";
import {Component, ComponentCtor} from "./Component";

export interface IWorld {
    CreateEntity(...components: [ComponentCtor<unknown>, unknown][]): Entity;
    DestroyEntity(entity: Entity): void;
    GetEntity(entityId: EntityId): Entity;

    RegisterSystem(system: {new (world: IWorld): System}): void;
}
