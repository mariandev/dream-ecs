import {ComponentId} from "./Component";

export class Archetype {
	constructor(private readonly _components: ReadonlySortedSet<ComponentId> = new ReadonlySortedSet()) {}

	public [Symbol.iterator]() {
		return this._components[Symbol.iterator]();
	}

	public HasComponent(componentId: ComponentId) {
		return this._components.has(componentId);
	}

	public AddComponent(componentId: ComponentId) {
		if(this.HasComponent(componentId)) return this;
		else {
			let newSet = new Set(this._components);
			newSet.add(componentId);

			return new Archetype(new ReadonlySortedSet(newSet));
		}
	}

	public RemoveComponent(componentId: ComponentId) {
		if(!this.HasComponent(componentId)) return this;
		else {
			const newSet = new Set<ComponentId>();

			for (let localComponent of this._components) {
				if(componentId !== localComponent) newSet.add(localComponent);
			}

			return new Archetype(new ReadonlySortedSet(newSet));
		}
	}

	public Equals(other: Archetype) {
		let lenThis = this._components.length;
		let lenOther = other._components.length;

		if(lenThis !== lenOther) return false;

		for(let i = 0;i < lenThis; i++) {
			if(this._components[i] != other._components[i]) return false;
		}

		return true;
	}
}

export class ReadonlySortedSet<T extends number> implements Iterable<T> {
	private readonly _store: T[];
	constructor(store: Iterable<T> = []) {
		this._store = Array.from(store).sort();
	}

	[Symbol.iterator]() {
		return this._store[Symbol.iterator]();
	}

	has(value: T) {
		return this._store.find(sv => sv === value);
	}

	get length() {
		return this._store.length;
	}
}
