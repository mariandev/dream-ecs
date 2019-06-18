import {IWorld} from "./IWorld";
import {Entity, EntityId} from "./Entity";
import {Query, QueryConditions, QueryHash} from "./Query";
import {Component, ComponentCtor, ComponentName, ComponentValue} from "./Component";
import {System} from "./System";
import {EntityCommandBuffer} from "./EntityCommandBuffer";

import * as Stats from "stats.js";

const stats = new Stats();
stats.showPanel(1);
window.addEventListener("load", () => document.body.appendChild( stats.dom ));

export class InternalWorld implements IWorld {
    private _entities = new Map<EntityId, Entity>();
    private _systems = [] as System[];
    private _queries = new Map<QueryHash, Query>();
    private _entitiesByQuery = new Map<QueryHash, ReadonlyArray<EntityId>>();
    private _queriesByComponent = new Map<ComponentName, ReadonlyArray<QueryHash>>();

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
            AddComponent: <T extends ComponentCtor<unknown>>(component: T, value: ComponentValue<T>) => {
                entity.__AddComponent(component, value);

                if(this._queriesByComponent.has(component.name)) {
                    queriesHashes.push(...this._queriesByComponent.get(component.name));
                }

                return entityBuilder;
            },
            AddRawComponents: (components: [ComponentCtor<unknown>, unknown][]) => {
                for (let [component, value] of components) {
                    entityBuilder.AddComponent(component, value);
                }

                return entityBuilder;
            },
            Create: () => {
                for (const query of new Set(queriesHashes)) {
                    this.RecalculateEntitiesForQuery(this._queries.get(query));
                }

                return entity;
            }
        };
        return entityBuilder;
    }

    public DestroyEntity(entity: Entity) {
        const queries = new Set<Query>();

        for(const component in entity.AttachedComponents) {
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
        this._systems.push(new system(this));
    }

    public OnComponentAdded(entity: Entity, component: ComponentCtor<unknown>) {
        // Recalculate entities for queries
        if(this._queriesByComponent.has(component.name)) {
            this._queriesByComponent
                .get(component.name)
                .map(hash => this._queries.get(hash))
                .forEach(query => this.RecalculateEntitiesForQuery(query));
        }
    }
    public OnComponentRemoved(entity: Entity, component: ComponentCtor<unknown>) {
        // Recalculate entities for queries
        if(this._queriesByComponent.has(component.name)) {
            this._queriesByComponent
                .get(component.name)
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

    public GetQueriesByComponent(componentName: ComponentName) {
        if(this._queriesByComponent.has(componentName)) {
            return this._queriesByComponent.get(componentName);
        } else {
            return [];
        }
    }

    private CalculateDeltaTime() {
        const ts = Date.now();
        if(this._lsts == null) this._lsts = ts;
        this.dt = (ts - this._lsts) / 1000;
        this._lsts = ts;
    }

    private AdvanceEntitiesToNextStep() {
        const queriesHashes = new Set<QueryHash>();

        this._entities.forEach((e: Entity) => {
            const components = [
                ...e.JustAddedComponents.now,
                ...e.JustRemovedComponents.now,
                ...e.JustAddedComponents.next,
                ...e.JustRemovedComponents.next
            ];

            for(const component of components) {
                this.GetQueriesByComponent(component).map(q => queriesHashes.add(q));
            }

            e.AdvanceToNextStep();
        });

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
            this.GetQueriesByComponent(component.name).map(q => queriesHashes.add(q));
        }

        for(const component of ecb.GetRemovedComponents()) {
            this.GetQueriesByComponent(component.name).map(q => queriesHashes.add(q));
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

        this.ExtractQueryHashesFromECB(ecb).forEach(hash => queriesToRecalculate.add(hash));
        this.AdvanceEntitiesToNextStep().forEach(hash => queriesToRecalculate.add(hash));

        this.RecalculateEntitiesForQueries(Array.from(queriesToRecalculate));

        stats.end();

        requestAnimationFrame(this._loop);
    };
}
