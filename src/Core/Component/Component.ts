import {EntityId} from '../Entity';

export type TypedArrayCtor = Uint8ArrayConstructor
	| Uint8ClampedArrayConstructor
	| Uint16ArrayConstructor
	| Uint32ArrayConstructor
	| Int8ArrayConstructor
	| Int16ArrayConstructor
	| Int32ArrayConstructor
	| Float32ArrayConstructor
	| Float64ArrayConstructor
	| BigInt64ArrayConstructor;

export type TypedArray = Uint8Array
	| Uint8ClampedArray
	| Uint16Array
	| Uint32Array
	| Int8Array
	| Int16Array
	| Int32Array
	| Float32Array
	| Float64Array
	| BigInt64Array;


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
		public static View: TypedArrayCtor;

    public static new(view: TypedArrayCtor) {
			let component = class extends Component {
				public static Id = ComponentIdGen.Gen;
				public static View = view;
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
