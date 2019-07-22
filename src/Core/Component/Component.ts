import {EntityId} from '../Entity';

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

    public static new<T extends number = number>() {
        const ctor = class extends Component<T> {};

        ctor.Id = ComponentIdGen.Gen;

        return ctor;
    }
}

export class TagComponent implements IComponent {}
