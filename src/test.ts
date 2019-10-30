import {Component, Excludes, Includes, System, TagComponent, World} from "./Core";

export const world = new World();

const PositionX = Component.new<number>();
const PositionY = Component.new<number>();
const Element = Component.new<HTMLDivElement>();

world.RegisterSystem(System.new(
	"Translocator",
	[
		new Includes(PositionX)
	],
	function(ecb) {
		for(const entity of this.GetEntities()) {
			const posX = entity.GetComponent(PositionX);
			const posY = entity.GetComponent(PositionY);
			ecb.AddComponent(entity.Id, PositionX, posX + (this.dt * posY) % 2);
		}
	}
));

world.RegisterSystem(System.new(
	"Render",
	[
		new Excludes(Element),
		new Includes(PositionY)
	],
	function(ecb) {
		for(const entity of this.GetEntities()) {
			const posY = entity.GetComponent(PositionY);
			const element = document.createElement("div");
			Object.assign(element.style, {
				width: "100px",
				height: "100px",
				position: "absolute",
				top: posY + "px",
				background: "hsl(" + (Math.random() * 360) + ", 50%, 50%)"
			});

			document.body.appendChild(element);

			ecb.AddComponent(entity.Id, Element, element);
		}
	}
));

world.RegisterSystem(System.new(
	"SetPosition",
	[
		new Includes(PositionX),
		new Includes(Element)
	],
	function() {
		for(const entity of this.GetEntities()) {
			const element = entity.GetComponent(Element);
			const posX = entity.GetComponent(PositionX);

			element.style.left = posX + "px";
		}
	}
));

world.RegisterSystem(System.new(
	"RemoveObsoleteEntities",
	[
		new Includes(Element),
		new Includes(PositionX)
	],
	function(ecb) {
		for(const entity of this.GetEntities()) {
			const posX = entity.GetComponent(PositionX);

			if(posX > innerWidth) {
				const element = entity.GetComponent(Element);

				document.body.removeChild(element);

				ecb.RemoveEntity(entity.Id);
			}
		}
	}
));

window.onload = function() {
	document.body.onclick = () => {
		for (let i = 0;i < 100; i++) {
			world
				.EntityBuilder()
				.AddComponent(PositionX, 0)
				.AddComponent(PositionY, Math.random() * innerHeight)
				.Create();
		}

		console.log((world as any)._internalWorld._entities.size);
	}
};

