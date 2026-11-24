import type { Behaviour } from "../types.js";
export type { Behaviour } from "../types.js";
import { Graph } from "../navigation/graph.js";
import { type Body, type Intent } from "../physics/motion.js";
export declare class Explorer {
    private graph;
    private random;
    plans: number;
    private targets;
    state: Behaviour;
    private wait;
    private path;
    private launched;
    private previousDistance;
    private stroll;
    private visits;
    private failures;
    private blocked;
    constructor(graph: Graph, random?: () => number);
    private rest;
    private fail;
    private plan;
    intent(body: Body): Intent;
}
