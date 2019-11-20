import {EntityCommandBuffer} from "./EntityCommandBuffer";
import {ComponentCtor, ComponentValue, TagComponentCtor} from "../Component";
import {EntityId} from "./Entity";
import {Logger} from "../Logger";

export class AsyncEntityCommandBuffer extends EntityCommandBuffer {
	public AddComponent<T extends TagComponentCtor>(entityId: EntityId, component: T): this;
	public AddComponent<T extends ComponentCtor<unknown>>(entityId: EntityId, component: T, value: ComponentValue<T>): this
	public AddComponent<T extends ComponentCtor<unknown>>(entityId: EntityId, component: T, value?: ComponentValue<T>): this {
		if(!this._world.HasEntity(entityId)) throw Logger.error(`Entity "${entityId}" cannot be found. Operation halted.`);

		return super.AddComponent(entityId, component, value);
	}

	public RemoveComponent<T extends ComponentCtor<unknown>>(entityId: EntityId, component: T): this {
		if(!this._world.HasEntity(entityId)) throw Logger.error(`Entity "${entityId}" cannot be found. Operation halted.`);

		return super.RemoveComponent(entityId, component);
	}

	public RemoveEntity(entityId: EntityId) {
		if(!this._world.HasEntity(entityId)) throw Logger.error(`Entity "${entityId}" cannot be found. Operation halted.`);

		return super.RemoveEntity(entityId);
	}
}
