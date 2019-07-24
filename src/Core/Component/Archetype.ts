import {ComponentId} from "./Component";

export class Archetype {
	private readonly _components: ReadonlyArray<ComponentId>;
	constructor(components: Set<ComponentId> = new Set()) {
		this._components = Array.from(components).sort();
	}

	public [Symbol.iterator]() {
		return this._components[Symbol.iterator]();
	}

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
		if(this.HasComponent(componentId)) return this;
		else {
			let newSet = new Set(this._components);
			newSet.add(componentId);

			return new Archetype(newSet);
		}
	}

	public RemoveComponent(componentId: ComponentId) {
		if(!this.HasComponent(componentId)) return this;
		else {
			const newSet = new Set<ComponentId>();

			for (let localComponent of this._components) {
				if(componentId !== localComponent) newSet.add(localComponent);
			}

			return new Archetype(newSet);
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
