import {Archetype} from "./Archetype";
import {EntityId} from "../Entity";
import {Component, ComponentValue} from "./Component";

export type ArchetypeStore = {
	index: {[entityId: number/*EntityId*/]: number};
	entity: Array<EntityId>,
	[componentId: number]: Array<ComponentValue<typeof Component>>
};

export class DataStorage {
	private _store = new Map<string, ArchetypeStore>();

	public GetStoreForArchetype(archetype: Archetype) {
		return this._store.get(archetype.Hash);
	}

	private IsEntityInStore(entityId: EntityId, archetype: Archetype) {
		const archetypeStore = this._store.get(archetype.Hash);
		return typeof archetypeStore.index[entityId] !== "undefined";
	}

	private FindSlotForEntity(entityId: EntityId, archetype: Archetype) {
		const archetypeStore = this._store.get(archetype.Hash);
		let idx = archetypeStore.index[entityId];

		if(typeof idx === "undefined") {
			idx = archetypeStore.entity.length;
		}

		return idx;
	}

	private HasStorageForArchetype(archetype: Archetype) {
		return this._store.has(archetype.Hash);
	}

	private CreateArchetypeStorage(archetype: Archetype) {
		let storage = {
			entity: [],
			index: {}
		} as ArchetypeStore;

		for(const componentId of archetype) {
			storage[componentId] = [];
		}

		this._store.set(archetype.Hash, storage);
	}

	public Update(dt: number) {
		// TODO: once a while try to reduce the archetype storage; GC
	}

	private FindLastEntitySlot(archetype: Archetype) {
		const archetypeStore = this._store.get(archetype.Hash);
		return archetypeStore.entity.length - 1;
	}

	public SetComponentData<T extends typeof Component>(entityId: EntityId, archetype: Archetype, component: T, value: ComponentValue<T>) {
		if (!this.HasStorageForArchetype(archetype)) {
			this.CreateArchetypeStorage(archetype);
		}

		const idx = this.FindSlotForEntity(entityId, archetype);

		const store = this._store.get(archetype.Hash);

		if(!this.IsEntityInStore(entityId, archetype)) {
			store.entity[idx] = entityId;
		}

		store[component.Id][idx] = value;

		this._store.set(archetype.Hash, store);
	}

	public TransferData(entityId: EntityId, prev: Archetype, next: Archetype) {
		if (!this.HasStorageForArchetype(next)) {
			this.CreateArchetypeStorage(next)
		}

		if (!this.HasStorageForArchetype(prev)) {
			this.CreateArchetypeStorage(prev)
		}

		const idxNext = this.FindSlotForEntity(entityId, next);
		const idxPrev = this.FindSlotForEntity(entityId, prev);

		const storeNext = this._store.get(next.Hash);
		const storePrev = this._store.get(prev.Hash);
		const idxFiller = this.FindLastEntitySlot(prev);

		storeNext.index[entityId] = idxNext;

		delete storePrev.index[entityId];

		storeNext.entity[idxNext] = entityId;

		for (const componentId of prev.Overlap(next)) {
			storeNext[componentId][idxNext] = storePrev[componentId][idxPrev];
		}

		if (idxFiller != -1) {
			const entityView = storePrev.entity;
			entityView[idxPrev] = entityView[idxFiller];

			for (const componentId of prev) {
				const view = storePrev[componentId];
				view[idxPrev] = view[idxFiller];
			}

			storePrev.index[entityView[idxFiller]] = idxPrev;
		}

		this._store.set(next.Hash, storeNext);
		this._store.set(prev.Hash, storePrev);
	}
}
