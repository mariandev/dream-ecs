import {Component, Entity, Excludes, Includes, System, TagComponent, World} from "./Core";
import {PositionComponent, SizeComponent} from './Sizes/Components';

const ParticleEmitterComponent = Component.new<{particles: number}>("ParticleEmitterComponent");
const ParticleEmitterInitializedComponent = Component.new("ParticleEmitterInitializedComponent");
const ParticleRenderContextComponent = Component.new<CanvasRenderingContext2D>("ParticleRenderContextComponent");
const InitialPositionComponent = Component.new<{x: number, y: number}>("InitialPositionComponent");
const VelocityComponent = Component.new<{x: number, y: number}>("VelocityComponent");
const SpeedComponent = Component.new<{x: number, y: number}>("SpeedComponent");
const LifetimeComponent = Component.new<number>("LifetimeComponent");
const ColorComponent = Component.new<number>("ColorComponent");
const ParticleGroupByColor = Component.new<{color: string, particles: Entity[]}>("ParticleGroupByColor");
const ParticleInColorGroup = TagComponent.new("ParticleInColorGroup");

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
		.AddComponent(ParticleEmitterComponent, {particles: 2500})
		.AddComponent(PositionComponent, {x: 400, y: 400})
		.AddComponent(ParticleRenderContextComponent, ctx)
		.Create();
});