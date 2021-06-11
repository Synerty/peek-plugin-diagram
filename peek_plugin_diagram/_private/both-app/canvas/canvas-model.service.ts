import { Injectable } from "@angular/core"
import { PeekCanvasModel } from "@_peek/peek_plugin_diagram/canvas/PeekCanvasModel.web"

@Injectable({
    providedIn: "root"
})
export class CanvasModelService {
    model: PeekCanvasModel
    
    constructor() {
    }
}
