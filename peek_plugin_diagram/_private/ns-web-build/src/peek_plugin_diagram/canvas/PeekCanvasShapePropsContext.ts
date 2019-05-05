
import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";

export enum ShapePropType {
    Layer,
    Level,
    FontStyle,
    Color,
    LineStyle,
    String,
    Option,
    Boolean,
}

export interface ShapePropOption {
    name: string;
    value: any;
}

export interface ShapePropGetter {
    (disp: any): any;
}

export interface ShapePropSetter {
    (disp: any, val: any): void;
}

export class ShapeProp {
    constructor(public type: ShapePropType,
                public getter: ShapePropGetter,
                public setter: ShapePropSetter,
                public name: string,
                public comment: string = '',
                public options: ShapePropOption[] | null = null) {

    }
}

export class PeekCanvasShapePropsContext {

    private _props: ShapeProp[] = [];

    constructor(public disp: {} = {},
                private lookupService: DiagramLookupService | null = null,
                private coordSetId: number | null = null) {

    }

    clearProps() {
        this._props = [];
    }

    addProp(prop: ShapeProp): void {
        this._props.push(prop);
    }

    props(): ShapeProp[] {
        return this._props;
    }

    get levelOptions(): ShapeProp[] {
        if (this.lookupService == null || this.coordSetId == null)
            return [];

        let opts: ShapePropOption[] = [];
        for (let layer of this.lookupService.layersOrderedByOrder()) {
            opts.push({
                name: layer.name,
                value: layer.id
            });
        }
    }

    get layerOptions(): ShapeProp[] {
        if (this.lookupService == null || this.coordSetId == null)
            return [];

        let opts: ShapePropOption[] = [];
        for (let level of this.lookupService.levelsOrderedByOrder(this.coordSetId)) {
            opts.push({
                name: level.name,
                value: level.id
            });
        }
    }

    get colorOptions(): ShapeProp[] {
        if (this.lookupService == null || this.coordSetId == null)
            return [];

        let opts: ShapePropOption[] = [];
        for (let level of this.lookupService.colorsOrderedByName()) {
            opts.push({
                name: level.name,
                value: level.id
            });
        }
    }


}