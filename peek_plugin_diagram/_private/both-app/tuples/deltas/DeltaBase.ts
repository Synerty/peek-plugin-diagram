
/** Branch Delta Base
 *
 * This is the base class of all diagram deltas.
 *
 */
export abstract class DeltaBase {
    static readonly TYPE_COLOUR_OVERRIDE = 1;

    static deltaType(delta): string[] {
        return delta[0];
    }
}