import {Component} from "./Component";
import {Entity} from "./Entity";
import {World} from "./World";
import {System} from "./System";
import {Condition, Includes, JustAdded, JustRemoved} from "./Conditions";
import {EntityCommandBuffer} from "./EntityCommandBuffer";

export * from "./Conditions";
export * from "./Entity";
export * from "./Component";
export * from "./World";
export * from "./System";

class ParentComponent extends Component<{parent: Entity}> {}

class CreateDOMElementComponent extends Component<{elType: keyof HTMLElementTagNameMap}> {}
class DOMElementComponent extends Component<{el: HTMLElement}> {}
class PositionComponent extends Component<{x: number, y: number}> {}
class SizeComponent extends Component<{x: number, y: number}> {}
class ColorComponent extends Component<{color: string}> {}
class RainbowComponent extends Component<{hue: number}> {}
class TheMasterComponent extends Component {}

class TrackClickEventComponent extends Component {}
class ClickListenerComponent extends Component<{listener: () => void}> {}
class JustClickedComponent extends Component {}

class Parent extends Condition {
    constructor(protected condition: Condition) {
        super(condition.component);
    }

    Evaluate(entity: Entity): boolean {
        return entity.HasComponent(ParentComponent) && this.condition.Evaluate(entity.GetComponent(ParentComponent).Value.parent);
    }

    Hash(): string {
        return `Parent(${this.condition.Hash()})`;
    }

}

class SetupDOMElementSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Includes(CreateDOMElementComponent)
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for(const entity of this.GetEntities()) {
            const elDef = entity.GetComponent(CreateDOMElementComponent).Value.elType;
            const parent = entity.GetComponent(ParentComponent).Value.parent;

            if(!parent.HasComponent(DOMElementComponent)) continue;

            const parentEl = parent.GetComponent(DOMElementComponent).Value.el;

            const el = document.createElement(elDef);
            parentEl.appendChild(el);

            ecb
                .RemoveComponent(entity.Id, CreateDOMElementComponent.name)
                .AddComponent(entity.Id, new DOMElementComponent({el}))
        }
    }
}

class SetPositionSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Includes(DOMElementComponent),
            new JustAdded(PositionComponent)
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for (const entity of this.GetEntities()) {
            const {x, y} = entity.GetComponent(PositionComponent).Value;
            const el = entity.GetComponent(DOMElementComponent).Value.el;

            el.style.position = "absolute";
            el.style.left = x + "px";
            el.style.top = y + "px";
        }
    }
}

class SetSizeSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Includes(DOMElementComponent),
            new JustAdded(SizeComponent)
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for (const entity of this.GetEntities()) {
            const {x, y} = entity.GetComponent(SizeComponent).Value;
            const el = entity.GetComponent(DOMElementComponent).Value.el;

            el.style.width = `${x}px`;
            el.style.height = `${y}px`;
        }
    }
}

class SetColorSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Includes(DOMElementComponent),
            new JustAdded(ColorComponent)
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for (const entity of this.GetEntities()) {
            const {color} = entity.GetComponent(ColorComponent).Value;
            const el = entity.GetComponent(DOMElementComponent).Value.el;

            el.style.backgroundColor = color;
        }
    }
}

class RainbowSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Includes(RainbowComponent)
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for (const entity of this.GetEntities()) {
            const {hue} = entity.GetComponent(RainbowComponent).Value;

            ecb
                .AddComponent(entity.Id, new ColorComponent({color: `hsl(${hue}deg, 100%, 50%)`}))
                .AddComponent(entity.Id, new RainbowComponent({hue: hue + this.dt * 100}))
        }
    }
}

class OnRainbowRemovedSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new JustRemoved(RainbowComponent)
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for (const entity of this.GetEntities()) {
            console.log(`It's a sad day for rainbows in entity #${entity.Id}'s world`);
        }
    }
}

class MoveByRandomSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Parent(new Includes(TheMasterComponent)),
            new Includes(PositionComponent)
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for (const entity of this.GetEntities()) {
            const {x, y} = entity.GetComponent(PositionComponent).Value;

            ecb.AddComponent(entity.Id, new PositionComponent({
                x: x + (Math.random() - .5) * 10,
                y: y + (Math.random() - .5) * 10
            }));
        }
    }
}

class TrackClickEventSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Includes(DOMElementComponent),
            new JustAdded(TrackClickEventComponent)
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for (const entity of this.GetEntities()) {
            const el = entity.GetComponent(DOMElementComponent).Value.el;

            const listener = () => {
                entity.AddComponent(new JustClickedComponent({}));
            };

            ecb.AddComponent(entity.Id, new ClickListenerComponent({listener}));

            el.addEventListener("click", listener);
        }
    }
}

class UntrackClickEventSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new Includes(DOMElementComponent),
            new Includes(ClickListenerComponent),
            new JustRemoved(TrackClickEventComponent)
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for (const entity of this.GetEntities()) {
            const el = entity.GetComponent(DOMElementComponent).Value.el;
            const listener = entity.GetComponent(ClickListenerComponent).Value.listener;

            el.removeEventListener("click", listener);
        }
    }
}

class OnClickSystem extends System {
    QueryConditions(): ReadonlyArray<Condition> {
        return [
            new JustAdded(JustClickedComponent)
        ];
    }

    Execute(ecb: EntityCommandBuffer) {
        for (const entity of this.GetEntities()) {
            console.log("Just clicked on entity #" + entity.Id);
        }
    }
}

export const world = new World();

window.addEventListener("load", () => {
    world.RegisterSystem(SetupDOMElementSystem);
    world.RegisterSystem(SetPositionSystem);
    world.RegisterSystem(SetSizeSystem);
    world.RegisterSystem(SetColorSystem);
    world.RegisterSystem(RainbowSystem);
    world.RegisterSystem(OnRainbowRemovedSystem);
    world.RegisterSystem(MoveByRandomSystem);

    world.RegisterSystem(TrackClickEventSystem);
    world.RegisterSystem(UntrackClickEventSystem);
    world.RegisterSystem(OnClickSystem);

    const creative = world.CreateEntity(
        new DOMElementComponent({el: document.body}),
        // new TheMasterComponent({})
    );

    const shape = world.CreateEntity(
        new ParentComponent({parent: creative}),
        new CreateDOMElementComponent({elType: "div"}),
        new PositionComponent({x: 100, y: 50}),
        new SizeComponent({x: 120, y: 120}),
        new ColorComponent({color: "red"}),
        new RainbowComponent({hue: 0}),
        new TrackClickEventComponent({})
    );

    const w = innerWidth;
    const h = innerHeight;

    document.body.addEventListener("click", () => {
        world.CreateEntity(
            new ParentComponent({parent: creative}),
            new CreateDOMElementComponent({elType: "div"}),
            new PositionComponent({x: Math.random() * w, y: Math.random() * h}),
            new SizeComponent({x: Math.random() * w, y: Math.random() * h}),
            new ColorComponent({color: "red"}),
            new RainbowComponent({hue: 180})
        );
    });

    document.body.addEventListener("keydown", () => {
        shape.RemoveComponent(TrackClickEventComponent.name);

        if(shape.HasComponent(RainbowComponent)) {
            shape.RemoveComponent(RainbowComponent.name);
        } else {
            shape.AddComponent(new RainbowComponent({hue: 0}));
        }
    })
});
