import {Entity, EntityId} from "../Entity/Entity";
import {System} from "../System/System";
import {ComponentCtor, ComponentValue} from "../Component/Component";

export type IWorldNewEntityReturnType = {
    AddComponent: <T extends ComponentCtor>(component: T, value: ComponentValue<T>) => IWorldNewEntityReturnType;
    AddRawComponents: (components: [ComponentCtor, number][]) => IWorldNewEntityReturnType;
    Create: () => Entity;
};

export interface IWorld {
    EntityBuilder(): IWorldNewEntityReturnType;

    GetEntity(entityId: EntityId): Entity;

    RegisterSystem(system: {new (world: IWorld): System}): void;
}
