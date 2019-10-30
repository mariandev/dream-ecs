import {EntityId} from '../Entity';

export type ComponentId = number;
class ComponentIdGen {
	private static _id = 0;
	public static get Gen(): EntityId {
		return ComponentIdGen._id++;
	}
}


export type ComponentCtor<T> = { new (): Component<T>, Id: ComponentId };
export type ComponentValue<T> = T extends ComponentCtor<infer U> ? U : unknown;

export abstract class Component<T extends any> {
    // Source: https://stackoverflow.com/a/55887088
    public _fixYourShitTypescript: T = undefined as unknown as T;

    public static Id: ComponentId;

    public static new<T = unknown>() {
        const ctor = class extends Component<T> {};

        ctor.Id = ComponentIdGen.Gen;

				Component.IdToComponent[ctor.Id] = ctor as any;

        return ctor;
    }

	public static readonly IdToComponent: {[componentId: number]: typeof Component} = {};
}

export abstract class TagComponent extends Component<void> {}
