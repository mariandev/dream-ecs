import {BaseComponent, ComponentId} from "./Component";

export class Archetype {
	constructor(private readonly _components: ReadonlySet<ComponentId> = new Set()) {}

	public [Symbol.iterator]() {
		return this._components.values();
	}

	public HasComponent(componentId: ComponentId) {
		return this._components.has(componentId);
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

			for (let localComponent of this._components.values()) {
				if(componentId !== localComponent) newSet.add(localComponent);
			}

			return new Archetype(newSet);
		}
	}
}
