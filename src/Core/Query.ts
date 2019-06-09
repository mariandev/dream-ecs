import {Condition} from "./Conditions";

export type QueryConditions = ReadonlyArray<Condition>;
export type QueryHash = string;
export class Query {
    public readonly Hash: string;

    constructor(public readonly QueryConditions: QueryConditions) {
        this.QueryConditions = [...QueryConditions].sort();
        this.Hash = Query.Hash(QueryConditions);
    }

    public static Hash(Query: QueryConditions): QueryHash {
        return [...Query].sort().map(c => c.Hash()).join(", ");
    }
}
