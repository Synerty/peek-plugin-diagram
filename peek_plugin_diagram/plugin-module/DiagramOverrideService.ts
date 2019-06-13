import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";
import {DiagramOverrideBase} from "./override/DiagramOverrideBase";

/** Diagram Override Service
 *
 * Overrides are temporary changes to the display of the diagram,
 * for example, highlighting conductors for a trace.
 *
 */
export abstract class DiagramOverrideService  extends ComponentLifecycleEventEmitter{

    abstract applyOverride(override: DiagramOverrideBase): void ;

    abstract revokeOverride(override: DiagramOverrideBase): void ;

}