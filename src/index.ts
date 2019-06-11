import {Component, Includes, JustAdded, System, World} from "./Core";
import {
    DOMClickedComponent,
    DOMElementComponent, DOMElementIdComponent, DOMTrackClickComponent,
    RegisterDOMSystems
} from "./DOM";
import {ParentComponent, PositionComponent, SizeComponent} from "./Base/Components";
import {DOMRendererComponent} from "./DOM/DOMRenderer";

export * from "./Core";
export * from "./Base/Conditions";
export * from "./DOM";

export const world = new World();

RegisterDOMSystems(world);

world.RegisterSystem(System.new(
    "DebugClick",
    [
        new JustAdded(DOMClickedComponent)
    ],
    function() {
        for(const entity of this.GetEntities()) {
            console.log("Just clicked on #" + entity.Id);
        }
    }
));

const RainbowComponent = Component.new<number>("RainbowComponent");
world.RegisterSystem(System.new(
    "RainbowSystem",
    [
        new Includes(DOMElementComponent),
        new Includes(RainbowComponent),
    ],
    function(ecb) {
        for(const entity of this.GetEntities()) {
            let hue = entity.GetComponent(RainbowComponent);
            hue += this.dt * 50;

            const el = entity.GetComponent(DOMElementComponent);

            el.style.backgroundColor = `hsl(${hue}deg, 100%, 50%)`;

            ecb.AddComponent(entity.Id, RainbowComponent, hue);
        }
    }
));

window.addEventListener("load", () => {
    const creative = world.CreateEntity(
        [DOMElementIdComponent, "creative"],
        [DOMElementComponent, document.body],
    );

    const shape = world.CreateEntity(
        [ParentComponent, creative],
        [DOMElementIdComponent, "shape1"],
        [DOMRendererComponent, "div"],
        [PositionComponent, {x: 200, y: 200}],
        [SizeComponent, {x: 50, y: 100}],
    );

    const w = innerWidth, h = innerHeight;
    document.body.addEventListener("click", () => {
        for(let i = 0; i < 100; i++) {
            world.CreateEntity(
                [ParentComponent, creative],
                [DOMElementIdComponent, "shape1"],
                [DOMRendererComponent, "div"],
                [PositionComponent, {x: Math.random() * w, y: Math.random() * h}],
                [SizeComponent, {x: Math.random() * w, y: Math.random() * h}],
                [RainbowComponent, 0]
            )
        }
    });
});
