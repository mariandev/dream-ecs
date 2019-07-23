import {IWorld} from "./IWorld";
import {Entity, EntityCommandBuffer, EntityId} from "../Entity";
import {Query, QueryConditions, QueryHash, System} from "../System";
import {ComponentCtor, ComponentId, ComponentValue} from "../Component";

import * as Stats from "stats.js";

const stats = new Stats();
stats.showPanel(0);
window.addEventListener("load", () => document.body.appendChild( stats.dom ));

export class InternalWorld implements IWorld {
    private _entities = new Map<EntityId, Entity>();
    private _systems = [] as System[];
    private _queries = new Map<QueryHash, Query>();
    private _entitiesByQuery = new Map<QueryHash, ReadonlyArray<EntityId>>();
    private _queriesByComponent = new Map<ComponentId, ReadonlyArray<QueryHash>>();

    private _lsts: number | null = null;
    public dt: number = 0;

    constructor() {
        this._loop();
    }

    public EntityBuilder() {
        const entity = new Entity(this);
        const queriesHashes: QueryHash[] = [];

        this._entities.set(entity.Id, entity);

        const entityBuilder = {
            AddComponent: <T extends ComponentCtor>(component: T, value: ComponentValue<T>) => {
                entity.__AddComponent(component, value);

                if(this._queriesByComponent.has(component.Id)) {
                    queriesHashes.push(...this._queriesByComponent.get(component.Id));
                }

                return entityBuilder;
            },
            AddRawComponents: (components: [ComponentCtor, number][]) => {
                for (let [component, value] of components) {
                    entityBuilder.AddComponent(component, value);
                }

                return entityBuilder;
            },
            Create: () => {
                entity.RecalculateArchetype();

                for (const query of new Set(queriesHashes)) {
                    this.RecalculateEntitiesForQuery(this._queries.get(query));
                }

                return entity;
            }
        };
        return entityBuilder;
    }

    public RemoveEntity(entity: Entity) {
        const queries = new Set<Query>();

        for(const [component] of entity.Components) {
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

    public OnComponentAdded(entity: Entity, component: ComponentCtor) {
        // Recalculate entities for queries
        if(this._queriesByComponent.has(component.Id)) {
            this._queriesByComponent
                .get(component.Id)
                .map(hash => this._queries.get(hash))
                .forEach(query => this.RecalculateEntitiesForQuery(query));
        }
    }
    public OnComponentRemoved(entity: Entity, component: ComponentCtor) {
        // Recalculate entities for queries
        if(this._queriesByComponent.has(component.Id)) {
            this._queriesByComponent
                .get(component.Id)
                .map(hash => this._queries.get(hash))
                .forEach(query => this.RecalculateEntitiesForQuery(query));
        }
    }

    private RecalculateEntitiesForQuery(query: Query) {
        let entities = [] as EntityId[];

        for(const [id, entity] of this._entities.entries()) {

            if(query.QueryConditions.every(condition => condition.Evaluate(entity))) {
                entities.push(id);
            }
        }

        this._entitiesByQuery.set(query.Hash, entities);
    }

    private RecalculateEntitiesForQueries(hashes: QueryHash[]) {
        Array.from(hashes)
            .map(hash => this._queries.get(hash))
            .forEach(query => this.RecalculateEntitiesForQuery(query));
    }

    public GetEntitiesForQuery(query: Query): ReadonlyArray<Entity> {
        return this._entitiesByQuery
            .get(query.Hash)
            .map(id => this._entities.get(id))
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
					for(const component of e.JustAddedComponents.now) {
					    for(const q of this.GetQueriesByComponent(component)) {
					        queriesHashes.add(q)
					    }
					}

					for(const component of e.JustAddedComponents.next) {
						for(const q of this.GetQueriesByComponent(component)) {
							queriesHashes.add(q)
						}
					}

					for(const component of e.JustRemovedComponents.now) {
						for(const q of this.GetQueriesByComponent(component)) {
							queriesHashes.add(q)
						}
					}

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

    private ExtractQueryHashesFromECB(ecb: EntityCommandBuffer) {
        const queriesHashes: Set<QueryHash> = new Set();

        for(const component of ecb.GetAddedComponents()) {
            for(const q of this.GetQueriesByComponent(component.Id)) queriesHashes.add(q);
        }

        for(const component of ecb.GetRemovedComponents()) {
					for(const q of this.GetQueriesByComponent(component.Id)) queriesHashes.add(q);
        }

        return queriesHashes;
    }

    private _loop = () => {
        this.CalculateDeltaTime();

        stats.begin();

        const queriesToRecalculate = new Set<QueryHash>();

        const ecb = new EntityCommandBuffer(this);

        this.ExecuteSystems(ecb);

        ecb.Execute();

        for(const hash of this.ExtractQueryHashesFromECB(ecb)) queriesToRecalculate.add(hash);
        for(const hash of this.AdvanceEntitiesToNextStep()) queriesToRecalculate.add(hash);

        this.RecalculateEntitiesForQueries(Array.from(queriesToRecalculate));

        stats.end();

        requestAnimationFrame(this._loop);
    };
}
