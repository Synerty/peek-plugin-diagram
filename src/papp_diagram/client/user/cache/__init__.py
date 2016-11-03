
__author__ = 'peek_server'


import os.path as p
from rapui import addClientSideResourceDir
from rapui.Util import filterModules

__modPath = p.dirname(__file__)
addClientSideResourceDir(__modPath, autoloadjs=False)

for mod in filterModules(__file__):
    __import__(mod, locals(), globals())
