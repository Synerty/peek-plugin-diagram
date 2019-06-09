/** Diagram Tool Button Callback Interface
 *
 * This interface represents a function that is called when the user selects a
 * toolbar menu option.
 *
 */
export interface DiagramToolButtonCallbackI {
    (): void;
}

/** Diagram Tool Button Interface
 *
 * This interface represents a hierarchy of toolbar buttons that are shown on the left
 * hand side of the diagram in the mobile view.
 *
 * NOTE: Don't assign a callback if children are set.
 *
 */
export interface DiagramToolButtonI {
    name: string;
    tooltip: string | null;
    icon: string | null;
    callback: DiagramToolButtonCallbackI | null;
    children: DiagramToolButtonI[];
}

/** Diagram Toolbar Service
 *
 * This service allows other plugins to provide tool buttons that are displayed
 * on the diagrams window.
 */
export abstract class DiagramToolbarService {
    constructor() {

    }

    /** Add Tool Button
     *
     * Call this method to add new tool buttons to the diagrams tool bar.
     * @param modelSetKey: The model set to show the button on the toolbar for.
     * null means all of them.
     *
     * @param coordSetKey: The coord set to show the button on the toolbar for.
     * null means all of them.
     *
     * @param toolButton: A single tool button, or a hierarchy of tool buttons to add
     * to the diagrams tool bar.
     *
     */
    abstract addToolButton(modelSetKey: string | null,
                           coordSetKey: string | null,
                           toolButton: DiagramToolButtonI);

    /** Add Edito Tool Button
     *
     * These toolbar buttons appear on the Edit toolbar.
     *
     * See Add Toolbar Button for more details
     *
     */
    abstract addEditToolButton(modelSetKey: string | null,
                           coordSetKey: string | null,
                           toolButton: DiagramToolButtonI);


    /** Set Exit Diagram Callback
     *
     * Set a callable that is called when the exit diagram button is clicked / tapped.
     *
     * @param callable
     */
    abstract setExitDiagramCallback(modelSetKey: string, callable: any): void;

}