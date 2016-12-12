
__author__ = 'peek_server'

import os.path as p

from txhttputil import addStaticResourceDir
from txhttputil.util.ModuleUtil import filterModules

__modPath = p.dirname(__file__)
addStaticResourceDir(__modPath, autoloadjs=False)

for mod in filterModules(__name__, __file__):
    __import__(mod, locals(), globals())
