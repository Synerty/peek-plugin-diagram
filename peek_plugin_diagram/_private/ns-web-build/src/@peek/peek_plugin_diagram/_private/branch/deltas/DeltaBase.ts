
/** Delta Base
 *
 * Static accessors, the code is structured to use these static accessor classes to
 * improve the performance of rendering.
 *
 * Rendering will require a smaller memory footprint, and no class instantiation to
 * access the json data, just like the diffs.
 *
 * This is the base class of all diagram deltas.
 *
 *
 */
export abstract class DeltaBase {
    static readonly TYPE_COLOUR_OVERRIDE = 1;

    static deltaType(delta): string[] {
        return delta[0];
    }
}