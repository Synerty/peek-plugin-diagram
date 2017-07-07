""" 
 * SynMOBHMI.rdbms.app.py
 *
 *  Copyright Synerty Pty Ltd 2011
 *
 *  This software is proprietary, you are not free to copy
 *  or redistribute this code in any format.
 *
 *  All rights to this software are reserved by 
 *  Synerty Pty Ltd
 *
"""
import logging

logger = logging.getLogger(__name__)


class GridSize:
    def __init__(self, min, max, key, xGrid, yGrid):
        self.min, self.max, self.key = min, max, key
        self.xGrid, self.yGrid = xGrid, yGrid


# To match a Z_GRID the display item must be min <= ON < max
# NOTE, The equal to is on the min side, not the max side

GRID_SIZES = {
    0: GridSize(min=0.0, max=0.04, key=0, xGrid=30000, yGrid=30000),
    1: GridSize(min=0.04, max=0.1, key=1, xGrid=10000, yGrid=10000),
    2: GridSize(min=0.1, max=0.5, key=2, xGrid=2000, yGrid=2000),
    3: GridSize(min=0.5, max=1000.0, key=3, xGrid=1000, yGrid=1000),
}


def makeGridKey(coordSetId, gridSize, x, y):
    ''' Make Grid Key

        coordSetId = ModelCoordSet.id
        gridSize = GridSize (above)
        x, y = Grid coordinates, top left
    '''
    return '%s|%s.%sx%s' % (coordSetId, gridSize.key, x, y)
