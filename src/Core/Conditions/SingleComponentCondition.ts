import {Condition} from "./Condition";
import {ComponentCtor} from "../Component";

export abstract class SingleComponentCondition extends Condition {
	constructor(protected _component: ComponentCtor<unknown>) {
		super(_component);
	}
}
