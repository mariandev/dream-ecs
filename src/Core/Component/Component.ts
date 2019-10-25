import {EntityId} from '../Entity';

export type ComponentId = number;
class ComponentIdGen {
	private static _id = 0;
	public static get Gen(): EntityId {
		return ComponentIdGen._id++;
	}
}


export type ComponentCtor = typeof Component | typeof TagComponent;
export type ComponentValue<T> = T extends typeof Component ? number | bigint : undefined;

export abstract class Component {
		public static Id: ComponentId;

    public static new() {
			let component = class extends Component {
				public static Id = ComponentIdGen.Gen;
			};

			Component.IdToComponent[component.Id] = component;

			return component as typeof Component;
    }

    public static readonly IdToComponent: {[componentId: number]: typeof Component} = {};
}

export abstract class TagComponent {
	public static Id: ComponentId;

	public static new() {
		return class extends Component {
			public static Id = ComponentIdGen.Gen;
		}
	}
}
