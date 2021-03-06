import {Entity, EntityId} from "../Entity/Entity";
import {System} from "../System/System";
import {ComponentCtor, ComponentValue} from "../Component/Component";
import {Query, QueryConditions} from "../System";

export type IWorldNewEntityReturnType = {
    AddComponent: <T extends ComponentCtor<unknown>>(component: T, value: ComponentValue<T>) => IWorldNewEntityReturnType;
    AddRawComponents: (components: [ComponentCtor<unknown>, unknown][]) => IWorldNewEntityReturnType;
    Create: () => Entity;
};

export interface IWorld {
    EntityBuilder(): IWorldNewEntityReturnType;

    GetEntity(entityId: EntityId): Entity;

    RegisterSystem(system: {new (world: IWorld): System}): void;

    CreateQuery(queryConditions: QueryConditions): Query;
}
