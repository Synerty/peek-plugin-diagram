import os

from suds import client as SudsClient


class PofRtClient:
    def __init__(self):
        wsdlDir = os.path.dirname(__file__)

        # This parses the wsdl file. The autoblend option you'd probably skip,
        # its needed when name spaces are not strictly preserved (case for Echo Sign).
        sudsClient = SudsClient.Client('file://' + wsdlDir + "/Realtime_inbound.wsdl",
                                       location="http://192.168.35.128:15043/enmac/SOAP/SOAPInBound/Realtime",
                                       autoblend=True)

        parameter = sudsClient.factory.create('FetchScalarValuesStc')

        compId1 = "SLM_EVENT_000"
        attr1 = "event000_00"

        compId2 = "ALIAS-395417-D"
        attr2 = "State"

        address1 = sudsClient.factory.create('RtdbAddressStc')
        address1.ComponentAlias = compId1
        address1.AttributeName = attr1
        parameter.Address.append(address1)

        address2 = sudsClient.factory.create('RtdbAddressStc')
        address2.ComponentAlias = compId2
        address2.AttributeName = attr2
        parameter.Address.append(address2)

        # Create a context for the call, example sendDocument() call. This doesn't yet
        # send anything, only creates an object with the request and capable of parsing
        # the response
        print parameter
        context = sudsClient.service.FetchScalarValues(parameter)

        # Actually send the request. Use any web client you want. I actually use
        # something more sophisticated, but below I put the example using
        # standard twisted web client.
        print str(context)

        # d = TwistedClient.getPage(url="http://192.168.35.128:15043/enmac/SOAP",
        #                           # url=context.client.location(),
        #                           postdata=str(context.envelope),
        #                           method='POST',
        #                           headers=context.client.headers())

        # The callback() of the above Deferred is fired with the body of the
        # http response. I parse it using the context object.
        # d.addCallback(context.succeeded)

        # Now in the callback you have the actual python object defined in
        # your WSDL file. You can print...
        # from pprint import pprint
        # d.addCallback(pprint)
        # I the response is a failure, your Deferred would be errbacked with
        # the suds.WebFault except
