import {DiagramLookupService} from "@peek/peek_plugin_diagram/DiagramLookupService";

export enum ShapePropType {
    Layer,
    Level,
    TextStyle,
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
                private modelSetId: number | null = null,
                private coordSetId: number | null = null) {

    }

    clearProps() {
        this._props = [];
    }

    addProp(prop: ShapeProp): void {
        this._props.push(prop);
    }

    get props(): ShapeProp[] {
        return this._props;
    }

    get levelOptions(): ShapeProp[] {
        return this.makeOptions(this.modelSetId,
            this.lookupService.layersOrderedByOrder);
    }

    get layerOptions(): ShapeProp[] {
        return this.makeOptions(this.coordSetId,
            this.lookupService.levelsOrderedByOrder);
    }

    get colorOptions(): ShapeProp[] {
        return this.makeOptions(this.modelSetId,
            this.lookupService.colorsOrderedByName);
    }

    get textStyleOptions(): ShapeProp[] {
        return this.makeOptions(this.modelSetId,
            this.lookupService.textStylesOrderedByName);
    }

    get lineStyleOptions(): ShapeProp[] {
        return this.makeOptions(this.modelSetId,
            this.lookupService.lineStylesOrderedByName);
    }


    private makeOptions(groupId: number, lookupServiceCallable): ShapeProp[] {
        if (this.lookupService == null || groupId == null)
            return [];

        let opts: ShapePropOption[] = [];
        for (let item of lookupServiceCallable(groupId)) {
            opts.push({
                name: item.name,
                value: item.id
            });
        }
    }


}