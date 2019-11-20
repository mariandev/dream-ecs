import {IWorld} from "./IWorld";
import {Entity, EntityCommandBuffer, EntityId} from "../Entity";
import {Query, QueryConditions, QueryHash, System} from "../System";
import {ComponentCtor, ComponentId, ComponentValue} from "../Component";

import * as Stats from "stats.js";
import {DependencyTree} from "../System/DependencyTree";
import {AsyncEntityCommandBuffer} from "../Entity/AsyncEntityCommandBuffer";

const stats = new Stats();
stats.showPanel(0);
window.addEventListener("load", () => document.body.appendChild( stats.dom ));

export class InternalWorld implements IWorld {
    private _entities = new Map<EntityId, Entity>();
    private _systems = new Map<Function, System>();
    private _queries = new Map<QueryHash, Query>();
    private _entitiesByQuery = new Map<QueryHash, ReadonlyArray<EntityId>>();
    private _queriesByComponent = new Map<ComponentId, ReadonlyArray<QueryHash>>();
    private _asyncEBCs: AsyncEntityCommandBuffer[] = [];

    public readonly DependencyTreeForSystems = new DependencyTree<Function>();

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

    private _queriesSetForRemoveEntity = new Set<QueryHash>();
    public RemoveEntity(entity: Entity) {
        this._queriesSetForRemoveEntity.clear();

        for(const component of Object.keys(entity.Components)) {
            const componentId = parseInt(component, 10);

            if(!this._queriesByComponent.has(componentId)) continue;

            this._queriesByComponent
                .get(componentId)
                .forEach(hash => this._queriesSetForRemoveEntity.add(hash));
        }

        this._entities.delete(entity.Id);

        this._queriesSetForRemoveEntity.forEach(query => this.RemoveEntityFromQueryEntityCache(query, entity.Id));
    }
    public GetEntity(entityId: EntityId): Entity {
        return this._entities.get(entityId);
    }
    public HasEntity(entityId: EntityId) {
    	return this._entities.has(entityId);
		}

    public CreateQuery(queryConditions: QueryConditions): Query {
        const queryHash = Query.Hash(queryConditions);

        if(this._queries.has(queryHash)) return this._queries.get(queryHash);

        const query = new Query(queryConditions);

        queryConditions.forEach(({ComponentsId}) => {
            const queries = [ query.Hash ] as QueryHash[];

            for(const component of ComponentsId) {
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
			this._systems.set(system, systemInstance);

			for (const query of Object.values(systemInstance.Queries)) {
          this.RecalculateEntitiesForQuery(query as Query);
      }
    }

    private RemoveEntityFromQueryEntityCache(hash: QueryHash, entityId: EntityId) {
        if(!this._entitiesByQuery.has(hash)) return;

        const entities = this._entitiesByQuery.get(hash) as Array<EntityId>;
        const entitiesLength = entities.length;

        if(entitiesLength === 0) return;
        else if(entitiesLength === 1) {
            entities.pop();
        } else {
            const index = entities.indexOf(entityId);

            if(index === -1) return;

            let lastIndex = entitiesLength - 1;
            if(index < lastIndex) {
                entities[index] = entities[lastIndex];
            }

            entities.length -= 1;
        }
    }

    private RecalculateEntitiesForQuery(query: Query) {
        let entities = [] as EntityId[];

        for(const entity of this._entities.values()) {
            if(query.QueryConditions.every(condition => condition.Evaluate(entity))) {
                entities.push(entity.Id);
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

    public GetEntitiesForQuery(query: Query): ReadonlyArray<EntityId> {
        return this._entitiesByQuery.get(query.Hash);
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

    private _componentsSetForAdvanceEntitiesToNextStep = new Set<ComponentId>();
    private _queriesHashesSetForAdvanceEntitiesToNextStep = new Set<QueryHash>();
    private AdvanceEntitiesToNextStep() {
        this._componentsSetForAdvanceEntitiesToNextStep.clear();
        this._queriesHashesSetForAdvanceEntitiesToNextStep.clear();

        for(const e of this._entities.values()) {
            for(const component of e.JustAddedComponents.next) {
                this._componentsSetForAdvanceEntitiesToNextStep.add(component);
            }

            for(const component of e.JustRemovedComponents.next) {
                this._componentsSetForAdvanceEntitiesToNextStep.add(component);
            }

            e.AdvanceToNextStep();
        }

        for(const component of this._componentsSetForAdvanceEntitiesToNextStep.values()) {
            for(const q of this.GetQueriesByComponent(component)) {
                this._queriesHashesSetForAdvanceEntitiesToNextStep.add(q)
            }
        }

        return this._queriesHashesSetForAdvanceEntitiesToNextStep;
    }

    public GetAsyncECB() {
        const aECB = new AsyncEntityCommandBuffer(this);

        this._asyncEBCs.push(aECB);

        return aECB;
    }

    private ExecuteSystems(ecb: EntityCommandBuffer) {
        for(const system of this.DependencyTreeForSystems.OrderedNodes) {
            this._systems.get(system).Execute(ecb);
				}
    }

    private _loop = () => {
        this.CalculateDeltaTime();

        stats.begin();

        const ecb = new EntityCommandBuffer(this);

        this.ExecuteSystems(ecb);

        ecb.Execute();

        for (const aecb of this._asyncEBCs) {
            aecb.Execute();
        }
        this._asyncEBCs.length = 0;

        this.RecalculateEntitiesForQueries(this.AdvanceEntitiesToNextStep());

        stats.end();

        requestAnimationFrame(this._loop);
    };
}
