import {DiagramOverride} from "./override/DiagramOverride";
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

/** Diagram Override Service
 *
 * Overrides are temporary changes to the display of the diagram,
 * for example, highlighting conductors for a trace.
 *
 */
export abstract class DiagramOverrideService  extends ComponentLifecycleEventEmitter{

    abstract create(modelSetKey: string, coordSetKey: string): DiagramOverride;

    abstract applyBranch(override: DiagramOverride): void ;

    abstract revokeBranch(override: DiagramOverride): void ;


}