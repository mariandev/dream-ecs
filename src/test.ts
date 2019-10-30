import {Component, Includes, System, World} from "./Core";

export const world = new World();

const PositionX = Component.new<number>();
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
		for(const entity of this.GetEntities()) {

		}
	}
));

window.onload = function() {
	document.body.onclick = () => {
		for (let i = 0;i < 10000; i++) {
			world
				.EntityBuilder()
				.AddComponent(PositionX, 0)
				.Create();
		}

		console.log((world as any)._internalWorld._entities.size);
	}
};

