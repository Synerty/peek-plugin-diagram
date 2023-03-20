/** Diagram Config Service
 *
 * This allows other plugins to configure the diagram thats currently shown.
 *
 */
import { DiagramToolbarBuiltinButtonEnum } from "@peek/peek_plugin_diagram/DiagramToolbarService";

export abstract class DiagramConfigService {
    abstract setLayerVisible(
        modelSetKey: string,
        layerName: string,
        visible: boolean
    ): void;

    abstract usePolylineEdgeColors(): boolean;

    abstract setUsePolylineEdgeColors(enabled: boolean): void;

    abstract setToolbarButtons(
        buttonBitmask: DiagramToolbarBuiltinButtonEnum
    ): void;
}
