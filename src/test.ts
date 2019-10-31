import {Component, Excludes, Includes, System, World} from "./Core";

export const world = new World();

const PositionX = Component.new<number>();
const PositionY = Component.new<number>();
const SpeedX = Component.new<number>();
const Element = Component.new<HTMLDivElement>();

world.RegisterSystem(System.new(
	"Translocator",
	{
		query: world.CreateQuery([
			new Includes(PositionX),
			new Includes(SpeedX)
		])
	},
	function(ecb) {
		for(const entityId of this.GetEntityIds(this.Queries.query)) {
			const entity = this.GetEntity(entityId);
			const posX = entity.GetComponent(PositionX);
			const speedX = entity.GetComponent(SpeedX);
			ecb.AddComponent(entity.Id, PositionX, posX + this.dt * speedX);
		}
	}
));

world.RegisterSystem(System.new(
	"Render",
	{
		query: world.CreateQuery([
			new Excludes(Element),
			new Includes(PositionY)
		])
	},
	function(ecb) {
		for(const entityId of this.GetEntityIds(this.Queries.query)) {
			const entity = this.GetEntity(entityId);
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

const q = world.CreateQuery([
	new Includes(PositionX),
	new Includes(Element)
]);

world.RegisterSystem(System.new(
	"SetPosition",
	{ q },
	function() {
		for(const entityId of this.GetEntityIds(this.Queries.q)) {
			const entity = this.GetEntity(entityId);
			const element = entity.GetComponent(Element);
			const posX = entity.GetComponent(PositionX);

			element.style.left = posX + "px";
		}
	}
));

world.RegisterSystem(System.new(
	"RemoveObsoleteEntities",
	{
		query: world.CreateQuery([
			new Includes(Element),
			new Includes(PositionX)
		])
	},
	function(ecb) {
		for(const entityId of this.GetEntityIds(this.Queries.query)) {
			const entity = this.GetEntity(entityId);
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
		for (let i = 0;i < 500; i++) {
			world
				.EntityBuilder()
				.AddComponent(PositionX, 0)
				.AddComponent(PositionY, Math.random() * innerHeight)
				.AddComponent(SpeedX, Math.random() * 100 + 100)
				.Create();
		}

		console.log((world as any)._internalWorld._entities.size);
	}
};

