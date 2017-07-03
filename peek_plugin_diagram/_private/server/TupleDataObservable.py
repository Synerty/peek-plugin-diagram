from vortex.handler.TupleDataObservableHandler import TupleDataObservableHandler

from peek_plugin_diagram._private.PluginNames import diagramFilt
from peek_plugin_diagram._private.PluginNames import diagramObservableName



def makeTupleDataObservableHandler(ormSessionCreator):
    """" Make Tuple Data Observable Handler

    This method creates the observable object, registers the tuple providers and then
    returns it.

    :param ormSessionCreator: A function that returns a SQLAlchemy session when called

    :return: An instance of :code:`TupleDataObservableHandler`

    """
    tupleObservable = TupleDataObservableHandler(
                observableName=diagramObservableName,
                additionalFilt=diagramFilt)

    # Register TupleProviders here
    # tupleObservable.addTupleProvider(StringIntTuple.tupleName(),
    #                                  StringIntTupleProvider(ormSessionCreator))
    return tupleObservable
