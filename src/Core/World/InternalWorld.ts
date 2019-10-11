import {IWorld} from "./IWorld";
import {Entity, EntityCommandBuffer, EntityId} from "../Entity";
import {Query, QueryConditions, QueryHash, System} from "../System";
import {Archetype, ComponentCtor, ComponentId, ComponentValue} from "../Component";

import * as Stats from "stats.js";
import {DataStorage} from "../Component/DataStorage";

const stats = new Stats();
stats.showPanel(0);
window.addEventListener("load", () => document.body.appendChild( stats.dom ));

export class InternalWorld implements IWorld {
    private _entities = new Map<EntityId, Entity>();
    private _systems = [] as System[];
    private _queries = new Map<QueryHash, Query>();
    private _archetypeByQuery = new Map<QueryHash, ReadonlySet<Archetype>>();
    private _queriesByComponent = new Map<ComponentId, ReadonlyArray<QueryHash>>();

    public readonly DataStorage = new DataStorage();

    private _lsts: number | null = null;
    public dt: number = 0;

    constructor() {
        this._loop();
    }

    public EntityBuilder() {
        const entity = new Entity();

        this._entities.set(entity.Id, entity);

        const ecb = new EntityCommandBuffer(this);

        const entityBuilder = {
            AddComponent: <T extends ComponentCtor>(component: T, value: ComponentValue<T>) => {
                ecb.AddComponent(entity.Id, component, value);

                return entityBuilder;
            },
            AddRawComponents: (components: [ComponentCtor, number | undefined][]) => {
                for (let [component, value] of components) {
                    entityBuilder.AddComponent(component, value as any);
                }

                return entityBuilder;
            },
            Create: () => {
                ecb.Execute();

                return entity;
            }
        };
        return entityBuilder;
    }

    public RemoveEntity(entity: Entity) {
        const queries = new Set<Query>();

        for(const component of entity.Archetype) {
            if(!this._queriesByComponent.has(component)) continue;

            this._queriesByComponent
                .get(component)
                .forEach(hash => queries.add(this._queries.get(hash)));
        }

        // Remove entity from Query entity cache
        queries.forEach(query => this.RecalculateEntitiesForQuery(query));

        this._entities.delete(entity.Id);
    }
    public GetEntity(entityId: number): Entity {
        return this._entities.get(entityId);
    }

    public CreateQuery(queryConditions: QueryConditions): Query {
        const queryHash = Query.Hash(queryConditions);

        if(this._queries.has(queryHash)) return this._queries.get(queryHash);

        const query = new Query(queryConditions);

        queryConditions.forEach(({ComponentsName}) => {
            const queries = [ query.Hash ] as QueryHash[];

            for(const component of ComponentsName) {
                if(this._queriesByComponent.has(component)) {
                    queries.unshift(...this._queriesByComponent.get(component));
                }

                this._queriesByComponent.set(component, queries);
            }
        });

        // Add to Query cache
        this._queries.set(queryHash, query);

        this.RecalculateEntitiesForQuery(query);

        return query;
    }

    public RegisterSystem(system: {new (world: IWorld): System}): void {
			let systemInstance = new system(this);
			this._systems.push(systemInstance);

			this.RecalculateEntitiesForQuery(systemInstance.Query);
    }

    private RecalculateEntitiesForQuery(query: Query) {
        let archetypes = new Set<Archetype>();

        for(const entity of this._entities.values()) {
            if(query.QueryConditions.every(condition => condition.Evaluate(entity))) {
                archetypes.add(entity.Archetype);
            }
        }

        this._archetypeByQuery.set(query.Hash, archetypes);
    }

    private RecalculateEntitiesForQueries(hashes: Iterable<QueryHash>) {
        for (const hash of hashes) {
            this.RecalculateEntitiesForQuery(
              this._queries.get(hash)
            )
        }
    }

    public GetArchetypesForQuery(query: Query): ReadonlySet<Archetype> {
        return this._archetypeByQuery
            .get(query.Hash);
    }

    public GetQueriesByComponent(componentId: ComponentId) {
        return this._queriesByComponent.get(componentId) || [];
    }

    private CalculateDeltaTime() {
        const ts = Date.now();
        if(this._lsts == null) this._lsts = ts;
        this.dt = (ts - this._lsts) / 1000;
        this._lsts = ts;
    }

    private AdvanceEntitiesToNextStep() {
        const queriesHashes = new Set<QueryHash>();

        for(const e of this._entities.values()) {
					// for(const component of e.JustAddedComponents.now) {
					//     for(const q of this.GetQueriesByComponent(component)) {
					//         queriesHashes.add(q)
					//     }
					// }

					for(const component of e.JustAddedComponents.next) {
						for(const q of this.GetQueriesByComponent(component)) {
							queriesHashes.add(q)
						}
					}

					// for(const component of e.JustRemovedComponents.now) {
					// 	for(const q of this.GetQueriesByComponent(component)) {
					// 		queriesHashes.add(q)
					// 	}
					// }

					for(const component of e.JustRemovedComponents.next) {
						for(const q of this.GetQueriesByComponent(component)) {
							queriesHashes.add(q)
						}
					}

					e.AdvanceToNextStep();
        }

        return queriesHashes;
    }

    private ExecuteSystems(ecb: EntityCommandBuffer) {
        for(const system of this._systems) {
            system.Execute(ecb);
				}
    }

    private _loop = () => {
        this.CalculateDeltaTime();

        stats.begin();

        const ecb = new EntityCommandBuffer(this);

        this.ExecuteSystems(ecb);

        ecb.Execute();

        this.RecalculateEntitiesForQueries(this.AdvanceEntitiesToNextStep());

        stats.end();

        requestAnimationFrame(this._loop);
    };
}
