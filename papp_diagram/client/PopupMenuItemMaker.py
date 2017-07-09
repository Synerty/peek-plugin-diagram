#!/usr/bin/env python

import json
import sys
from base64 import b64decode
from collections import defaultdict

URL_GET_COMMAND_ONLY = 1
URL_POST_COMMAND_ONLY = 2
URL_OPEN_NEW_TAB = 3
URL_OPEN_IN_FRAME = 4

result = {'error': None,
          'menuItems': []}

MENU_HANDLERS = defaultdict(list)


def addMenuHandler(menuName):
    def decorator(func):
        MENU_HANDLERS[menuName].append(func)
        return func

    return decorator


def makeMenuItem(name, url, tooltip='', urlType=URL_OPEN_IN_FRAME):
    result['menuItems'].append({'name': name,
                                'tooltip': tooltip,
                                'url': url,
                                'urlType': urlType,
                                })


def run(argData):
    ''' Example JSON input data
    
    {"data1": "'Transformer WEL'",
     "action": "1 (Popup Menu + Dressing)",
     "nodeRef": "J0000e875COMP",
     "flashOnce": "0"}

    '''

    if not argData:
        result['error'] = "argData was empty"
        print(json.dumps(result))
        return

    actionData = json.loads(b64decode(argData))
    componentId= actionData['nodeRef']
    menuName = actionData['data1']

    for handlerFunc in MENU_HANDLERS[menuName]:
        handlerFunc(menuName, componentId)

    print(json.dumps(result))


###############################################################################
#### BEGIN CUSTOM CODE FOR MENUS 
###############################################################################

'''

MENU_NAME,  ITEM_ORDER, ITEM_NAME,  DATA2
'tele cb rack pca','Predict Fault Location','%(host)s/prototype/diagram/geoview/?traceToFaultId=%(comp)s&traceToFaultTarget=1847'
'tele cb pca','Predict Fault Location',     '%(host)s/prototype/diagram/geoview/?traceToFaultId=%(comp)s&traceToFaultTarget=1847'


'D-Transformer','Show MD','%(host)s/load/profiles/#/maxdemand?fromAsset=%(comp)s&autoplot=true&results=5'

'6.6kv conductor pca','Show Downstream Load',        '%(host)s/load/profiles/#/maxdemand?fromAsset=%(comp)s&autoplot=true&results=10'
'6.6kv conductor pca','Load From','SEND_URL_COMMAND','%(host)s/load/profiles/v1/store/bill/key/fromAsset/value/%(comp)s'
'6.6kv conductor pca','Load To Here',                '%(host)s/load/profiles/#/maxdemand?toAsset=%(comp)s&fetchParams=bill&autoplot=true&results=5'

'11kv conductor pca','Show Downstream Load',        '%(host)s/load/profiles/#/maxdemand?fromAsset=%(comp)s&autoplot=true&results=10'
'11kv conductor pca','Load From','SEND_URL_COMMAND','%(host)s/load/profiles/v1/store/bill/key/fromAsset/value/%(comp)s'
'11kv conductor pca','Load To Here',                '%(host)s/load/profiles/#/maxdemand?toAsset=%(comp)s&fetchParams=bill&autoplot=true&results=5'

'22kv conductor pca','Show Downstream Load',        '%(host)s/load/profiles/#/maxdemand?fromAsset=%(comp)s&autoplot=true&results=10'
'22kv conductor pca','Load From','SEND_URL_COMMAND','%(host)s/load/profiles/v1/store/bill/key/fromAsset/value/%(comp)s'
'22kv conductor pca','Load To Here',                '%(host)s/load/profiles/#/maxdemand?toAsset=%(comp)s&fetchParams=bill&autoplot=true&results=5'


'''
EWB_HOST = 'http://localhost:9000'

def params(componentId):
    return {'host': EWB_HOST,
            'comp': componentId}

# ----------------------------------------------------------------------------------------
@addMenuHandler('tele cb rack pca')
@addMenuHandler('tele cb pca')
def traceToFault(menuName, componentId):
    url = '%(host)s/prototype/diagram/geoview/?traceToFaultId=%(comp)s&traceToFaultTarget=1847'
    url %= params(componentId)
    makeMenuItem(name="Predict Fault Location",
                 url=url,
                 urlType=URL_OPEN_NEW_TAB)


# ----------------------------------------------------------------------------------------
@addMenuHandler('D-Transformer')
def showMd(menuName, componentId):
    url = '%(host)s/load/profiles/#/maxdemand?fromAsset=%(comp)s&autoplot=true&results=5'
    url %= params(componentId)
    makeMenuItem(name="Show MD",
                 url=url,
                 urlType=URL_OPEN_NEW_TAB)


# ----------------------------------------------------------------------------------------
@addMenuHandler('6.6kv conductor pca')
@addMenuHandler('11kv conductor pca')
@addMenuHandler('22kv conductor pca')
def showDownstreemLoad(menuName, componentId):
    url = '%(host)s/load/profiles/#/maxdemand?fromAsset=%(comp)s&autoplot=true&results=10'
    url %= params(componentId)
    makeMenuItem(name="Show Downstream Load",
                 url=url,
                 urlType=URL_OPEN_NEW_TAB)
    

    url = '%(host)s/load/profiles/v1/store/bill/key/fromAsset/value/%(comp)s'
    url %= params(componentId)
    makeMenuItem(name="Load From",
                 url=url,
                 urlType=URL_POST_COMMAND_ONLY)
    

    url = '%(host)s/load/profiles/#/maxdemand?toAsset=%(comp)s&fetchParams=bill&autoplot=true&results=5'
    url %= params(componentId)
    makeMenuItem(name="Load To Here",
                 url=url,
                 urlType=URL_OPEN_NEW_TAB)


@addMenuHandler('Transformer WEL')
def welTest(menuName, componentId):

    url = '%(host)s/cmdtest?menuid=%s&compid=%s' %( menuName, componentId)
    makeMenuItem(name="url get command test",
                 url=url,
                 urlType=URL_GET_COMMAND_ONLY)

    url = '%(host)s/cmdtest?menuid=%s&compid=%s' %( menuName, componentId)
    makeMenuItem(name="url post command test",
                 url=url,
                 urlType=URL_POST_COMMAND_ONLY)

    url = '%(host)s/frametest?menuid=%s&compid=%s' %( menuName, componentId)
    makeMenuItem(name="url frame test",
                 url=url,
                 urlType=URL_OPEN_IN_FRAME)

    url = '%(host)s/frametest?menuid=%s&compid=%s' %( menuName, componentId)
    makeMenuItem(name="url tab test",
                 url=url,
                 urlType=URL_OPEN_NEW_TAB)


###############################################################################
#### END CUSTOM CODE FOR MENUS 
###############################################################################

if __name__ == '__main__':
    argData = sys.argv[1]
    run(argData)
