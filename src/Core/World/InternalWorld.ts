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

        this._entities.set(entity.Id, entity);

        const ecb = new EntityCommandBuffer(this);

        const entityBuilder = {
            AddComponent: <T extends ComponentCtor<unknown>>(component: T, value: ComponentValue<T>) => {
                ecb.AddComponent(entity.Id, component, value);

                return entityBuilder;
            },
            AddRawComponents: (components: [ComponentCtor<unknown>, unknown][]) => {
                for (let [component, value] of components) {
                    entityBuilder.AddComponent(component, value);
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

    private _queriesSetForRemoveEntity = new Set<Query>();
    public RemoveEntity(entity: Entity) {
        this._queriesSetForRemoveEntity.clear();

        for(const [component] of entity.Components) {
            if(!this._queriesByComponent.has(component)) continue;

            this._queriesByComponent
                .get(component)
                .forEach(hash => this._queriesSetForRemoveEntity.add(this._queries.get(hash)));
        }

        // Remove entity from Query entity cache
        this._queriesSetForRemoveEntity.forEach(query => this.RecalculateEntitiesForQuery(query));

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
        let entities = [] as EntityId[];

        for(const [id, entity] of this._entities.entries()) {

            if(query.QueryConditions.every(condition => condition.Evaluate(entity))) {
                entities.push(id);
            }
        }

        this._entitiesByQuery.set(query.Hash, entities);
    }

    private RecalculateEntitiesForQueries(hashes: Iterable<QueryHash>) {
        for(const hash of hashes) {
            this.RecalculateEntitiesForQuery(
              this._queries.get(hash)
            );
        }
    }

    public GetEntitiesForQuery(query: Query): ReadonlyArray<Entity> {
        const entities = this._entitiesByQuery.get(query.Hash);
        const entitiesCount = entities.length;
        const result = new Array(entitiesCount);

        for(let i = 0;i < entitiesCount;i++) {
            result[i] = this._entities.get(entities[i]);
        }

        return result;
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

    private _queriesHashesSetForAdvanceEntitiesToNextStep = new Set<QueryHash>();
    private AdvanceEntitiesToNextStep() {
        this._queriesHashesSetForAdvanceEntitiesToNextStep.clear();

        for(const e of this._entities.values()) {
            for(const component of e.JustAddedComponents.next) {
                for(const q of this.GetQueriesByComponent(component)) {
                    this._queriesHashesSetForAdvanceEntitiesToNextStep.add(q)
                }
            }

            for(const component of e.JustRemovedComponents.next) {
                for(const q of this.GetQueriesByComponent(component)) {
                    this._queriesHashesSetForAdvanceEntitiesToNextStep.add(q)
                }
            }

            e.AdvanceToNextStep();
        }

        return this._queriesHashesSetForAdvanceEntitiesToNextStep;
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
