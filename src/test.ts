import {Component, Includes, System, World} from "./Core";

export const world = new World();

const PositionX = Component.new();
const PositionY = Component.new();
const PositionZ = Component.new();
const RotationX = Component.new();
const RotationY = Component.new();
const RotationZ = Component.new();
const RotationW = Component.new();

world.RegisterSystem(System.new(
	"Translocator",
	[
		new Includes(PositionX)
	],
	function(ecb) {
		// const positions = this.GetComponentData(PositionX);
		// const entities = this.GetEntities();
		//
		// for (const entity of entities) {
		// 	const position = positions.next().value as number;
		//
		// 	ecb.AddComponent(entity, PositionX, position + this.dt);
		// }

		// const positions = this.GetComponentData(PositionX);
		this.GetEntitiesV2(function() {
			// const position = positions.next().value as number;

			// ecb.AddComponent(entity, PositionX, position + this.dt);
		});
	}
));

window.onload = function() {
	document.body.onclick = () => {
		for (let i = 0;i < 1000; i++) {
			world
				.EntityBuilder()
				.AddComponent(PositionX, 0)
				.Create();
		}

		console.log((world as any)._internalWorld._entities.size);
	}
};


