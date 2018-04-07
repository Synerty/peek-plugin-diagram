
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

/** Diagram Menu Item Callback Interface
 *
 * This interface defines a callback that will be called when the menu item is clicked
 * but the user.
 *
 */
export interface DiagramMenuItemCallbackI {
    (): void;
}

/** Diagram Menu Item Interface
 *
 * This interface represents a hierarchy of a menu items that will be presented to
 * a user when the popup appears for a diagram item click/tap.
 *
 * NOTE: Don't specify both children and a callback, as the click/tap event will
 * navigate to the child menu options.
 *
 */
export interface DiagramMenuItemI {
    name: string;
    tooltip: string | null;
    icon: string | null;
    callback: DiagramMenuItemCallbackI | null;
    children: DiagramMenuItemI[];
    closeOnCallback?: boolean;
}

/** Diagram Item Detail Interface
 *
 * This interface represents some some detail that another plugin wants to appear
 * on the diagram item select popup.
 */
export interface DiagramItemDetailI {
    title:string;
    value:string; // TODO: Add support for tables, etc.
}

export interface DiagramItemPopupContextI {

    /** The is the key assigned to the Disp item when it was imported */
    key: string;

    /** The is the data assigned to the Disp item when it was imported */
    data: {};

    /** The key of the model set that this Disp belongs to */
    modelSetKey: string;

    /** The ket of the coordinate set that this Disp belongs to */
    coordSetKey: string;

    /** Add Menu Item
     *
     * @param menuItem: A menu item, or the root menu item of a hierarchy of items to add.
     */
    addMenuItem(menuItem: DiagramMenuItemI): void;

    /** Add Detail Items
     *
     * @param details: A list of details display on the popup.
     */
    addDetailItems(details: DiagramItemDetailI[]): void;
}

/** Diagram Item Popup Service
 *
 * This service provides support for other plugins to integrate with the diagram.
 *
 * When a selectable item on the diagram is clicked/tapped, an observable event will
 * be fired with a context class, allowing the other plugin to add menus and details to the popup.
 */
export abstract class DiagramItemPopupService {
    constructor() {

    }

    /** Item Popup Observable
     *
     * This method returns an observer for this coordSetKey, that is fired when the item
     * is selected.
     */
    abstract itemPopupObservable(): Observable<DiagramItemPopupContextI> ;

}