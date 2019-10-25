import {ComponentId} from "./Component";

export class Archetype implements Iterable<ComponentId> {
	public static SortFn(one: number, two: number) {
		return one - two;
	}

	private readonly _components: ReadonlyArray<ComponentId>;

	constructor(components: ReadonlyArray<ComponentId> = []) {
		this._components = [...components];
	}

	public static fromSet(components: Set<ComponentId>) {
		return new Archetype(Array.from(components).sort(Archetype.SortFn));
	}

	public [Symbol.iterator]() {
		return this._components[Symbol.iterator]();
	}

	private _hash: string | undefined;
	public get Hash(): string {
		if(typeof this._hash === "undefined") {
			this._hash = this._components.join(", ");
		}
		return this._hash as string;
	};

	public HasComponent(componentId: ComponentId) {
		const len = this._components.length;
		for(let i = 0; i < len; i++) {
			let lv = this._components[i];
			if (lv == componentId) return true;
			if (lv > componentId) return false;
		}
		return false;
	}

	public AddComponent(componentId: ComponentId) {
		const components = [...this._components];
		const length = components.length;

		for(let i = 0; i < length; i++) {
			let cid = components[i];
			if(cid > componentId) {
				components.splice(i, 0, componentId);
			} else if(cid == componentId) {
				break;
			} else if(i == length - 1) {
				components.push(componentId);
			}
		}

		return new Archetype(components);
	}

	public RemoveComponent(componentId: ComponentId) {
		const components = [...this._components];
		const length = components.length;

		for(let i = 0; i < length; i++) {
			if(components[i] == componentId) {
				components.splice(i, 1);
			}
		}

		return new Archetype(components);
	}

	public EqualsWithArray(otherIterable: Iterable<ComponentId>) {
		const other = Array.from(otherIterable).sort(Archetype.SortFn);
		const lenThis = this._components.length;
		const lenOther = other.length;

		if(lenThis !== lenOther) return false;

		for(let i = 0;i < lenThis; i++) {
			if(this._components[i] != other[i]) return false;
		}

		return true;
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

	public OverlapWithIterable(other: Iterable<ComponentId>): Iterable<number> {
		return this.OverlapWithArray(Array.from(other).sort(Archetype.SortFn))
	}

	public Overlap(other: Archetype): Iterable<number> {
		return this.OverlapWithArray(other._components);
	}

	private *OverlapWithArray(other: ReadonlyArray<ComponentId>): Iterable<number> {
		const one = this._components;
		const two = Array.from(other).sort(Archetype.SortFn);

		const lenOne = one.length;
		const lenTwo = two.length;

		let it = 0, io = 0;
		while(true) {
			if(it >= lenOne || io >= lenTwo) break;

			const valOne = one[it];
			const valTwo = two[io];

			if(valOne === valTwo) {
				yield valOne;
				it++;
				io++;
			} else if(valOne < valTwo) {
				it++;
			} else {
				io++;
			}
		}
	}

	public DiffWithIterable(other: Iterable<ComponentId>): Iterable<number> {
		return this.DiffWithArray(Array.from(other).sort(Archetype.SortFn))
	}

	public Diff(other: Archetype): Iterable<number> {
		return this.DiffWithArray(other._components);
	}

	private *DiffWithArray(other: ReadonlyArray<ComponentId>) {
		const one = this._components;
		const two = Array.from(other).sort(Archetype.SortFn);

		const lenOne = one.length;
		const lenTwo = two.length;

		let iOne = 0, iTwo = 0;
		while(true) {
			if(iOne >= lenOne) {
				for(let k = iTwo;k < lenTwo; k++) yield two[k];
				break;
			}

			if(iTwo >= lenTwo) break;

			const valOne = one[iOne];
			const valTwo = two[iTwo];

			if(valOne < valTwo) {
				iOne++;
			} else if(valOne === valTwo) {
				iOne++;
				iTwo++;
			} else {
				yield valTwo;
				iTwo++;
			}
		}
	}
}
