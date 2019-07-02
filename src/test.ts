import {Component, Entity, EntityId, Excludes, Includes, System, TagComponent, World} from "./Core";
import {PositionComponent, SizeComponent} from './Sizes/Components';

const ParticleEmitterComponent = Component.new<{particles: number}>();
const ParticleEmitterInitializedComponent = Component.new();
const ParticleRenderContextComponent = Component.new<CanvasRenderingContext2D>();
const InitialPositionComponent = Component.new<{x: number, y: number}>();
const VelocityComponent = Component.new<{x: number, y: number}>();
const SpeedComponent = Component.new<{x: number, y: number}>();
const LifetimeComponent = Component.new<number>();
const ColorComponent = Component.new<number>();
const ParticleGroupByColor = Component.new<{color: string, particles: Entity[]}>();
const ParticleInColorGroup = TagComponent.new();

export const world = new World();

world.RegisterSystem(System.new(
	"ParticleSpawnerSystem",
	[
		new Includes(ParticleEmitterComponent),
		new Includes(PositionComponent),
		new Includes(ParticleRenderContextComponent),
		new Excludes(ParticleEmitterInitializedComponent)
	],
	function(ecb) {
		for(const emitter of this.GetEntities()) {
			const {x, y} = emitter.GetComponent(PositionComponent);
			const {particles} = emitter.GetComponent(ParticleEmitterComponent);

			for(let i = 0; i < particles; i++) {
				ecb.CreateEntity()
					.AddComponent(InitialPositionComponent, {x, y})
					.AddComponent(ParticleRenderContextComponent, emitter.GetComponent(ParticleRenderContextComponent))
					.AddComponent(ColorComponent, (i * 60) % 360)
					.AddComponent(LifetimeComponent, -1);
			}

			ecb.AddComponent(emitter.Id, ParticleEmitterInitializedComponent, null);
		}
	}
));

world.RegisterSystem(System.new(
	"ParticleSpawnerClearSystem",
	[
		new Includes(ParticleEmitterComponent),
		new Includes(ParticleRenderContextComponent)
	],
	function() {
		for(const emitter of this.GetEntities()) {
			const ctx = emitter.GetComponent(ParticleRenderContextComponent);

			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		}
	}
));

// type Point = {x: number, y: number};
// type JobOut = {velocity: Point[], speed: Point[], position: Point[]};
// type JobIn = JobOut & {dt: number};
// const job = new window["Job"](function(args: JobIn): JobOut {
// 	const len = args.position.length;
// 	const dt = args.dt;
// 	const gdt = 9.81 * dt;
//
// 	for(let i = 0;i < len;i++) {
// 		args.velocity[i].y += gdt;
//
// 		args.speed[i].x += args.velocity[i].x * dt;
// 		args.speed[i].y += args.velocity[i].y * dt;
//
// 		args.position[i].x += args.speed[i].x * dt;
// 		args.position[i].y += args.speed[i].y * dt;
// 	}
//
// 	return args;
// });
//
// world.RegisterSystem(System.new(
// 	"ParticleUpdateSystem",
// 	[
// 		new Includes(PositionComponent),
// 		new Includes(SpeedComponent),
// 		new Includes(VelocityComponent),
// 	],
// 	function(ecb) {
// 		const ids: EntityId[] = [];
// 		const jobArgs = {
// 			velocity: [],
// 			speed: [],
// 			position: [],
// 			dt: this.dt
// 		};
//
// 		for(const particle of this.GetEntities()) {
// 			ids.push(particle.Id);
// 			jobArgs.velocity.push(particle.GetComponent(VelocityComponent));
// 			jobArgs.speed.push(particle.GetComponent(SpeedComponent));
// 			jobArgs.position.push(particle.GetComponent(PositionComponent));
// 		}
//
// 		return job.Schedule(jobArgs).then((result) => {
// 			const len = ids.length;
// 			for(let i = 0;i < len; i++) {
// 				ecb
// 					.AddComponent(ids[i], PositionComponent, result.position[i])
// 					.AddComponent(ids[i], SpeedComponent, result.speed[i])
// 					.AddComponent(ids[i], VelocityComponent, result.velocity[i])
// 			}
//
// 			return result;
// 		});
// 	}
// ));

world.RegisterSystem(System.new(
	"ParticleUpdateSystem",
	[
		new Includes(PositionComponent),
		new Includes(SpeedComponent),
		new Includes(VelocityComponent),
	],
	function(ecb) {
		for(const particle of this.GetEntities()) {
			let position = particle.GetComponent(PositionComponent);
			let speed = particle.GetComponent(SpeedComponent);
			let velocity = particle.GetComponent(VelocityComponent);

			velocity = {
				x: velocity.x,
				y: velocity.y + 9.81 * this.dt
			};

			speed = {
				x: speed.x + velocity.x * this.dt,
				y: speed.y + velocity.y * this.dt
			};

			position = {
				x: position.x + speed.x * this.dt,
				y: position.y + speed.y * this.dt
			};

			ecb
				.AddComponent(particle.Id, PositionComponent, position)
				.AddComponent(particle.Id, SpeedComponent, speed)
				.AddComponent(particle.Id, VelocityComponent, velocity)
		}
	}
));

world.RegisterSystem(System.new(
	"ParticleDestroyerSystem",
	[
		new Includes(LifetimeComponent)
	],
	function(ecb) {
		for(const particle of this.GetEntities()) {
			let lifetime = particle.GetComponent(LifetimeComponent);

			lifetime -= this.dt;

			if(lifetime < 0) {
				const {x, y} = particle.GetComponent(InitialPositionComponent);

				ecb
					.AddComponent(particle.Id, PositionComponent, {x, y})
					.AddComponent(particle.Id, SpeedComponent, {x: 0, y: 0})
					.AddComponent(particle.Id, VelocityComponent, {x: Math.random() * 20 - 10, y: Math.random() * -80})
					.AddComponent(particle.Id, LifetimeComponent, Math.random() * 5 + 5)
					.AddComponent(particle.Id, SizeComponent, {x: 1, y: 1});
			} else {
				ecb.AddComponent(particle.Id, LifetimeComponent, lifetime);
			}
		}
	}
));

world.RegisterSystem(System.new(
	"GroupParticlesSystem",
	[
		new Includes(ColorComponent),
		new Excludes(ParticleInColorGroup)
	],
	function(ecb) {
		const particlesByColor = new Map<number, Entity[]>();
		for(const particle of this.GetEntities()) {
			const color = particle.GetComponent(ColorComponent);
			const arr = particlesByColor.get(color);
			if(arr) {
				arr.push(particle);
			} else {
				particlesByColor.set(color, [particle]);
			}

			ecb.AddComponent(particle.Id, ParticleInColorGroup, null);
		}

		for(const [color, particles] of particlesByColor.entries()) {
			ecb.CreateEntity()
				.AddComponent(ParticleGroupByColor, {color: `hsl(${color}deg, 100%, 50%)`, particles});
		}
	}
));

world.RegisterSystem(System.new(
	"ParticleRendererSystem",
	[
		new Includes(ParticleGroupByColor)
	],
	function() {
		for(const entity of this.GetEntities()) {
			const {color, particles} = entity.GetComponent(ParticleGroupByColor);
			const ctx = particles[0].GetComponent(ParticleRenderContextComponent);
			ctx.fillStyle = color;
			ctx.beginPath();
			for(let i = 0;i < particles.length; i++) {
				const particle = particles[i];
				const position = particle.GetComponent(PositionComponent);
				const size = particle.GetComponent(SizeComponent);

				ctx.rect(position.x, position.y, size.x, size.y);
			}
			ctx.closePath();
			ctx.fill();
		}
	}
));

window.addEventListener("load", () => {
	const canvas = document.createElement("canvas");
	document.body.appendChild(canvas);
	canvas.width = innerWidth;
	canvas.height = innerHeight;

	const ctx = canvas.getContext("2d");

	const spawner = world.EntityBuilder()
		.AddComponent(ParticleEmitterComponent, {particles: 1000})
		.AddComponent(PositionComponent, {x: 400, y: 400})
		.AddComponent(ParticleRenderContextComponent, ctx)
		.Create();
});