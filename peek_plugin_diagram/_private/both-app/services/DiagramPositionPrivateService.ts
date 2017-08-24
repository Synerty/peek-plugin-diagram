import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {Subject} from "rxjs";

export function diagramPositionPrivateServiceFactory(): DiagramPositionService {
    return new DiagramPositionPrivateService();
}

export interface DiagramPositionI {
    coordSetKey: string;
    x: number;
    y: number;
    zoom: number;
}

export class DiagramPositionPrivateService extends DiagramPositionService {
    positionObservable: Subject<DiagramPositionI>;

    position(coordSetKey: string, x: number, y: number, zoom: number): void {
        this.positionObservable.next({
            coordSetKey: coordSetKey,
            x: x,
            y: y,
            zoom: zoom
        });
    }

}