import {Entity, EntityId} from "./Entity";
import {System} from "./System";
import {Component, ComponentCtor, ComponentValue} from "./Component";

export type IWorldNewEntityReturnType = {
    AddComponent: <T extends ComponentCtor<unknown>>(component: T, value: ComponentValue<T>) => IWorldNewEntityReturnType;
    AddRawComponents: (components: [ComponentCtor<unknown>, unknown][]) => IWorldNewEntityReturnType;
    Create: () => Entity;
};

export interface IWorld {
    EntityBuilder(): IWorldNewEntityReturnType;

    DestroyEntity(entity: Entity): void;
    GetEntity(entityId: EntityId): Entity;

    RegisterSystem(system: {new (world: IWorld): System}): void;
}
