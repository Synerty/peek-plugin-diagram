/** Diagram Config Service
 *
 * This service is used to change config options in the currently displayed diagram.
 *
 */
import {ComponentLifecycleEventEmitter} from "@synerty/vortexjs";

export abstract class DiagramConfigService extends ComponentLifecycleEventEmitter {

    /*
        abstract changeLayerVisibility(modelSetKey: string,
                                      coordSetKey: string,
                                      lagerKeys:string[],
                                      visible:true): void;
    */
}