import { PrivateDiagramLookupService } from "@peek/peek_plugin_diagram/_private/services/PrivateDiagramLookupService"
import { DispBaseT } from "../canvas-shapes/DispBase"

export enum ShapePropType {
    Layer,
    Level,
    TextStyle,
    Color,
    LineStyle,
    String,
    Integer,
    MultilineString,
    Option,
    Boolean,
}

export interface ShapePropOption {
    object: any;
    name: string;
    value: any;
}

export interface ShapePropGetter {
    (disp: any): any;
}

export interface ShapePropSetter {
    (
        disp: any,
        val: any
    ): void;
}

export class ShapeProp {
    __lastShowValue = null
    public comment: string
    public allowNullOption: boolean
    public alternateDisp: DispBaseT | null
    private _optionByValue: { [value: string]: any } = {}
    
    constructor(
        public type: ShapePropType,
        public getter: ShapePropGetter,
        public setter: ShapePropSetter,
        public name: string,
        opts: {
            comment?: string,
            options?: ShapePropOption[],
            allowNullOption?: boolean,
            alternateDisp?: DispBaseT,
        } = {}
    ) {
        this.comment = opts.comment || ""
        this.options = opts.options || []
        this.allowNullOption = opts.allowNullOption || false
        this.alternateDisp = opts.alternateDisp
        
    }
    
    private _options: ShapePropOption[] | null = null
    
    get options(): ShapePropOption[] {
        return this._options
    }
    
    set options(options: ShapePropOption[]) {
        this._optionByValue = {}
        this._options = options
        if (options != null) {
            for (let op of options) {
                op.value = op.value.toString()
                this._optionByValue[op.value] = op
            }
        }
    }
    
    getOptionObject(value: string): any {
        return this._optionByValue[value].object
    }
}

export class PeekCanvasShapePropsContext {
    
    clea
    addP
    prop
    priv
    ate
    private _props: ShapeProp[] = []
    
    constructor(
        public disp: DispBaseT = <any>{},
        private lookupService: PrivateDiagramLookupService | null = null,
        private modelSetId: number | null = null,
        private coordSetId: number | null = null
    ) {
    
    }
    
    get textStyleOptions(): ShapePropOption[] {
        return this.makeOptions(this.modelSetId,
            this.lookupService.textStylesOrderedByName(this.modelSetId))
    }
    
    get lineStyleOptions(): ShapePropOption[] {
        return this.makeOptions(this.modelSetId,
            this.lookupService.lineStylesOrderedByName(this.modelSetId))
    }
    
    get rProps() {
        this._props = []
    }
    
    get rop(prop: ShapeProp): void {
        this._props.push(prop)
    }
    
    get s(): ShapeProp[] {
        return this._props
    }
    
    levelOptions(): ShapePropOption[] {
        return this.makeOptions(this.coordSetId,
            this.lookupService.levelsOrderedByOrder(this.coordSetId))
    }
    
    layerOptions(): ShapePropOption[] {
        return this.makeOptions(this.modelSetId,
            this.lookupService.layersOrderedByOrder(this.modelSetId))
    }
    
    colorOptions(): ShapePropOption[] {
        return this.makeOptions(this.modelSetId,
            this.lookupService.colorsOrderedByName(this.modelSetId))
    }
    
    makeOptions(
        groupId: number,
        items
    ): ShapePropOption[] {
        if (this.lookupService == null || groupId == null)
            return []
        
        let opts: ShapePropOption[] = []
        for (let item of items) {
            opts.push({
                object: item,
                name: item.name,
                value: item.id
            })
        }
        return opts
    }
    
}
