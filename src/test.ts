import {Component, EntityCommandBuffer, Includes, System, World} from "./Core";

export const world = new World();

const PositionX = Component.new<number>();
const PositionY = Component.new<number>();
const SpeedX = Component.new<number>();

@World.RegisterSystem()
class TranslocatorSystem extends System {
	Queries = {
		query: world.CreateQuery([
			new Includes(PositionX),
			new Includes(SpeedX)
		])
	};

	Execute(ecb: EntityCommandBuffer) {
		for(const entityId of this.GetEntityIds(this.Queries.query)) {
			const entity = this.GetEntity(entityId);
			const posX = entity.GetComponent(PositionX);
			const speedX = entity.GetComponent(SpeedX);
			ecb.AddComponent(entity.Id, PositionX, posX + this.dt * speedX);
		}
	}
}

@World.RegisterSystem()
@World.ExecuteAfter(TranslocatorSystem)
class SetPositionSystem extends System {
	Queries = {
		query: world.CreateQuery([
			new Includes(PositionX)
		])
	};

	Execute(ecb: EntityCommandBuffer) {
		if(!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.beginPath();
		for(const entityId of this.GetEntityIds(this.Queries.query)) {
			const entity = this.GetEntity(entityId);
			const posX = entity.GetComponent(PositionX);
			const posY = entity.GetComponent(PositionY);


			ctx.rect(posX, posY, 1, 1);
		}
		ctx.fillStyle = "red";
		ctx.fill();
	}
}

@World.RegisterSystem()
@World.ExecuteAfter(SetPositionSystem)
class ResetEntitiesSystem extends System {
	Queries = {
		query: world.CreateQuery([
			new Includes(PositionX)
		])
	};

	Execute(ecb: EntityCommandBuffer) {
		for(const entityId of this.GetEntityIds(this.Queries.query)) {
			const entity = this.GetEntity(entityId);
			const posX = entity.GetComponent(PositionX);

			if(posX > innerWidth) {
				ecb.AddComponent(entityId, PositionX, -100);
			}
		}
	}
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

window.onload = function() {
	canvas = document.createElement("canvas");
	ctx = canvas.getContext("2d");

	canvas.width = innerWidth;
	canvas.height = innerHeight;

	canvas.style.position = "absolute";
	canvas.style.left = "0";
	canvas.style.right = "0";
	canvas.style.top = "0";
	canvas.style.bottom = "0";

	document.body.appendChild(canvas);

	document.body.onclick = () => {
		for (let i = 0;i < 500; i++) {
			world
				.EntityBuilder()
				.AddComponent(PositionX, -100)
				.AddComponent(PositionY, Math.random() * innerHeight)
				.AddComponent(SpeedX, Math.random() * 100 + 100)
				.Create();
		}

		console.log((world as any)._internalWorld._entities.size);
	}
};
