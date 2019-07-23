import {Component, World} from "./Core";

export const world = new World();

const PositionX = Component.new(Uint8Array);

const entity = world.EntityBuilder()
	.AddComponent(PositionX, 1)
	.Create();

console.log(entity);
