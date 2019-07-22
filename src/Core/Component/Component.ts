import {EntityId} from '../Entity';

type TypedArrayCtor = Uint8ArrayConstructor
	| Uint8ClampedArrayConstructor
	| Uint16ArrayConstructor
	| Uint32ArrayConstructor
	| Int8ArrayConstructor
	| Int16ArrayConstructor
	| Int32ArrayConstructor
	| Float32ArrayConstructor
	| Float64ArrayConstructor;


export type ComponentId = number;
class ComponentIdGen {
	private static _id = 0;
	public static get Gen(): EntityId {
		return ComponentIdGen._id++;
	}
}


export type ComponentCtor<T extends number = number> = { new (): Component<T>, Id: ComponentId };
export type ComponentValue<T> = T extends ComponentCtor<infer U> ? U : unknown;

export interface IComponent { }

export abstract class Component<T extends number = number> implements IComponent {
    // Source: https://stackoverflow.com/a/55887088
    public _fixYourShitTypescript: T = undefined as unknown as T;

		public static Id: ComponentId;
		public static View: TypedArrayCtor;

    public static new<T extends number = number>(view: TypedArrayCtor) {
        return class extends Component<T> {
					public static Id = ComponentIdGen.Gen;
					public static View = view;
				}
    }
}

export abstract class TagComponent implements IComponent {
	public static Id: ComponentId;

	public static new<T extends number = number>() {
		return class extends Component<T> {
			public static Id = ComponentIdGen.Gen;
		}
	}
}
