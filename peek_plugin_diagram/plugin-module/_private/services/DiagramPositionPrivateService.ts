import {Injectable} from "@angular/core";
import {DiagramPositionService} from "@peek/peek_plugin_diagram/DiagramPositionService";
import {Subject} from "rxjs";


export interface DiagramPositionI {
    coordSetKey: string;
    x: number;
    y: number;
    zoom: number;
}


@Injectable()
export class DiagramPositionPrivateService extends DiagramPositionService {
    constructor() {
        super();

    }

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