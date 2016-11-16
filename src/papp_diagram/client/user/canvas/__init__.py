__author__ = 'peek_server'

import os.path as p
from rapui import addStaticResourceDir
from rapui.Util import filterModules

__modPath = p.dirname(__file__)
addStaticResourceDir(__modPath, autoloadjs=False)

for mod in filterModules(__file__):
    __import__(mod, locals(), globals())
