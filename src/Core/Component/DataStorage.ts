import {Archetype} from "./Archetype";
import {Entity, EntityId} from "../Entity";
import {Component, ComponentValue, TypedArray, TypedArrayCtor} from "./Component";

export type ArchetypeStore = {
	length: number;
	maxLength: number;
	index: {[entityId: number/*EntityId*/]: number};
	entity: Uint32Array,
	[componentId: number]: TypedArray
};

export class DataStorage {
	private static _store_chunk_size = 5;
	private _store = new Map<string, ArchetypeStore>();

	public GetStoreForArchetype(archetype: Archetype) {
		return this._store.get(archetype.Hash);
	}

	private ExpandArchetypeStorage(archetype: Archetype) {
		let store = this._store.get(archetype.Hash);
		let chunkSize = DataStorage._store_chunk_size;

		if (store) {
			store.maxLength += chunkSize;

			let oldBufferView = store.entity;
			let newBuffer = new ArrayBuffer(store.entity.byteLength + chunkSize * Uint32Array.BYTES_PER_ELEMENT);
			let newBufferView = new Uint32Array(newBuffer);
			newBufferView.set(oldBufferView);
			store.entity = newBufferView;

			for (const componentId of archetype) {
				let view = Component.IdToComponent[componentId].View;
				let oldBuffer = store[componentId];
				let oldBufferView = oldBuffer;
				let newBuffer = new ArrayBuffer(oldBuffer.byteLength + chunkSize * view.BYTES_PER_ELEMENT);
				let newBufferView = new view(newBuffer);
				newBufferView.set(oldBufferView as any);
				store[componentId] = newBufferView;
			}
		} else {
			store = {
				length: 0,
				maxLength: chunkSize,
				entity: new Uint32Array(new ArrayBuffer(chunkSize * Uint32Array.BYTES_PER_ELEMENT)),
				index: {}
			};

			for (const componentId of archetype) {
				let view = Component.IdToComponent[componentId].View;
				store[componentId] = new view(new ArrayBuffer(chunkSize * view.BYTES_PER_ELEMENT));
			}
		}

		this._store.set(archetype.Hash, store);
	}

	private ReduceArchetypeStorage(archetype: Archetype) {
		// TODO: for GC
	}

	private HasStorageForArchetype(archetype: Archetype) {
		let archetypeStore = this._store.get(archetype.Hash);
		return archetypeStore && archetypeStore.length < archetypeStore.maxLength;
	}

	private IsEntityInStore(entityId: EntityId, archetype: Archetype) {
		const archetypeStore = this._store.get(archetype.Hash);
		return typeof archetypeStore.index[entityId] !== "undefined";
	}

	private FindSlotForEntity(entityId: EntityId, archetype: Archetype) {
		const archetypeStore = this._store.get(archetype.Hash);
		let idx = archetypeStore.index[entityId];

		if(typeof idx === "undefined") {
			const entityView = new Uint32Array(archetypeStore.entity);

			idx = entityView.findIndex(v => v === 0);

			if (idx === -1) throw new Error(`Cannot find available slot for entity #${entityId} with archetype '${archetype.Hash}'`);
		}

		return idx;
		// const archetypeStore = this._store.get(archetype.Hash);
		// const entityView = new Uint32Array(archetypeStore.entity);
		// const len = archetypeStore.maxLength;
		// let idx = 0;
		//
		// for (; idx < len; idx++) {
		// 	let localEntityId = entityView[idx];
		// 	if (localEntityId == entityId || localEntityId == 0) break;
		// }
		//
		// if (idx == len) throw new Error(`Cannot find available slot for entity #${entityId} with archetype '${archetype.Hash}'`);
		//
		// return idx;
	}

	private FindLastEntitySlot(archetype: Archetype) {
		const archetypeStore = this._store.get(archetype.Hash);
		return archetypeStore.length - 1;
	}

	public Update(dt: number) {
		// TODO: once a while try to reduce the archetype storage; GC
	}

	public SetComponentData<T extends typeof Component>(entityId: EntityId, archetype: Archetype, component: T, value: ComponentValue<T>) {
		if (!this.HasStorageForArchetype(archetype)) {
			this.ExpandArchetypeStorage(archetype);
		}

		const idx = this.FindSlotForEntity(entityId, archetype);

		const store = this._store.get(archetype.Hash);

		if(!this.IsEntityInStore(entityId, archetype)) {
			store.length += 1;
			store.entity[idx] = entityId;
		}

		store[component.Id][idx] = value;

		this._store.set(archetype.Hash, store);
	}

	public TransferData(entityId: EntityId, prev: Archetype, next: Archetype) {
		if (!this.HasStorageForArchetype(next)) {
			this.ExpandArchetypeStorage(next)
		}

		if (!this.HasStorageForArchetype(prev)) {
			this.ExpandArchetypeStorage(prev)
		}

		const idxNext = this.FindSlotForEntity(entityId, next);
		const idxPrev = this.FindSlotForEntity(entityId, prev);

		const storeNext = this._store.get(next.Hash);
		const storePrev = this._store.get(prev.Hash);
		const idxFiller = this.FindLastEntitySlot(prev);

		storeNext.length += 1;
		storeNext.index[entityId] = idxNext;

		delete storePrev.index[entityId];

		storeNext.entity[idxNext] = entityId;

		for (const componentId of prev.Overlap(next)) {
			const viewType = Component.IdToComponent[componentId].View;
			const view = new viewType(storePrev[componentId]);

			storeNext[componentId][idxNext] = view[idxPrev];
		}

		if (idxFiller != -1) {
			const entityView = storePrev.entity;
			entityView[idxPrev] = entityView[idxFiller];

			for (const componentId of prev) {
				const view = storePrev[componentId];
				view[idxPrev] = view[idxFiller];
			}

			storePrev.length -= 1;
			storePrev.index[entityView[idxFiller]] = idxPrev;
		}

		this._store.set(next.Hash, storeNext);
		this._store.set(prev.Hash, storePrev);
	}

	// private AddValueInBuffer(buffer: ArrayBuffer, ctor: TypedArrayCtor, index: number, value: any) {
	// 	const view = new ctor(buffer, index * ctor.BYTES_PER_ELEMENT, 1);
	// 	view[0] = value;
	// }

	private static ResizeArrayBuffer(source: ArrayBuffer, viewCtor: TypedArrayCtor, by: number) {
		const sourceView = new viewCtor(source);

		const destination = new ArrayBuffer(source.byteLength + by * viewCtor.BYTES_PER_ELEMENT);
		const destinationView = new viewCtor(destination);

		destinationView.set(sourceView as any);

		return destination;
	}
}
