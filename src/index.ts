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
            let hue = entity.GetComponent(RainbowComponent).Value;
            hue += this.dt * 50;

            const el = entity.GetComponent(DOMElementComponent).Value;

            el.style.backgroundColor = `hsl(${hue}deg, 100%, 50%)`;

            ecb.AddComponent(entity.Id, new RainbowComponent(hue));
        }
    }
));

window.addEventListener("load", () => {
    const creative = world.CreateEntity(
        new DOMElementIdComponent("creative"),
        new DOMElementComponent(document.body),
    );

    const shape = world.CreateEntity(
        new ParentComponent(creative),
        new DOMElementIdComponent("shape1"),
        new DOMRendererComponent("div"),
        new PositionComponent({x: 200, y: 200}),
        new SizeComponent({x: 50, y: 100}),
        new DOMTrackClickComponent({stopPropagation: true}),
    );

    const shape2 = world.CreateEntity(
        new ParentComponent(shape),
        new DOMRendererComponent("div"),
        new PositionComponent({x: 100, y: 200}),
        new SizeComponent({x: 150, y: 10}),
        new DOMTrackClickComponent({stopPropagation: true}),
        new RainbowComponent(70),
    );

    const shape3 = world.CreateEntity(
        new ParentComponent(creative),
        new DOMRendererComponent("div"),
        new PositionComponent({x: 100, y: 200}),
        new SizeComponent({x: 150, y: 10}),
        new DOMTrackClickComponent({stopPropagation: true}),
        new RainbowComponent(0),
    );

    const w = innerWidth, h = innerHeight;
    document.body.addEventListener("click", () => {
        for(let i = 0; i < 100; i++) {
            world.CreateEntity(
                new ParentComponent(creative),
                new DOMRendererComponent("div"),
                new PositionComponent({x: Math.random() * w, y: Math.random() * h}),
                new SizeComponent({x: Math.random() * w, y: Math.random() * h}),
                new RainbowComponent(0),
            )
        }
    });
});
