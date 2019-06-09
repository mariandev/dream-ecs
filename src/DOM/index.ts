import {World} from "../Core";
import {DOMTrackClickEventSystem, DOMUntrackClickEventSystem} from "./DOMClick";
import {DOMRendererSystem} from "./DOMRenderer";
import {DOMElementIdSystem} from "./DOMElementId";

export * from "./DOMElement";
export * from "./DOMElementId";
export * from "./DOMRenderer";
export * from "./DOMClick";

export function RegisterDOMSystems(world: World) {
    world.RegisterSystem(DOMRendererSystem);
    world.RegisterSystem(DOMTrackClickEventSystem);
    world.RegisterSystem(DOMUntrackClickEventSystem);
    world.RegisterSystem(DOMElementIdSystem);
}
