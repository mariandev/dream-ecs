import {Component, Includes, System, World} from "./Core";

export const world = new World();

const PositionX = Component.new(Float32Array);
const PositionY = Component.new(Uint8Array);
const PositionZ = Component.new(Uint8Array);
const RotationX = Component.new(Uint8Array);
const RotationY = Component.new(Uint8Array);
const RotationZ = Component.new(Uint8Array);
const RotationW = Component.new(Uint8Array);

world.RegisterSystem(System.new(
	"Translocator",
	[
		new Includes(PositionX)
	],
	function(ecb) {
		const positions = this.GetComponentData(PositionX);
		const entities = this.GetEntities();

		for (const entity of entities) {
			const position = positions.next().value as number;

			ecb.AddComponent(entity, PositionX, position + this.dt);
		}
	}
));

window.onload = function() {
	document.body.onclick = () => {
		for (let i = 0;i < 10; i++) {
			world
				.EntityBuilder()
				.AddComponent(PositionX, 0)
				.Create();
		}
	}
};


