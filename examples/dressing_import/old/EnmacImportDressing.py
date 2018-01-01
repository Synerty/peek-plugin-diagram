import logging
from datetime import datetime

import os
import pytz
from geoalchemy2.shape import to_shape, from_shape
from peek.core.import_enmac.EnmacImportLookups import _EnmacImportLookups
from peek.core.import_enmac.EnmacImportPprim import EnmacImportPprim
from peek.core.import_enmac.EnmacImportPprimConn import EnmacImportPprimConn
from peek.core.import_enmac.EnmacImportPprimDynamic import EnmacImportPprimDynamic
from peek.core.import_enmac.EnmacImportPprimHotspot import EnmacImportPprimHotspot
from peek.core.import_enmac.EnmacImportPprimPoly import EnmacImportPprimPoly
from peek.core.import_enmac.EnmacImportPprimText import EnmacImportPprimText
from peek.core.import_enmac.ImportHacks import DIST_WORLD, DRESSING_GRID_KEY
from shapely.affinity import translate
from sqlalchemy.orm import joinedload
from twisted.internet.defer import DeferredList
from twisted.internet.threads import deferToThread

from peek.core.orm import getNovaOrmSession
from peek.core.orm.Display import DispBase
from peek.core.orm.Display import DispGroup
from peek.core.orm.GridKeyIndex import GridKeyIndex, GridKeyIndexUpdate
from peek.core.orm.ModelSet import ModelCoordSet
from peek_agent_pof.imp_display.EnmacImportPprimEllipse import EnmacImportPprimEllipse

logger = logging.getLogger(__name__)

TEST_F = '00890088.txt'
D = '/media/psf/stash/dressings/'

'''
for f in `find . -type f`
do
    Y=`echo $f | sed 's,^./,,g;s,/,=,g'`
    pprim $f > /mnt/hgfs/Downloads/dressings/$Y
done
'''
class EnmacImportDressing(EnmacImportPprim):
    """ Enmac PPrim Parse

    What do I want?

    I want to detect the deltas using a has of each item.

    I want to group symbols together.

    I want to parse each item
    """

    SECTION_MARKER = '*' * 79
    SUBSECTION_MARKER = '-' * 79

    def __init__(self):
        pass

    def run(self, *args):

        """
        type             2 (Circle)
        type             3 (Hot Spot)
        type             4 (Line)
        type             5 (Symbol)
        type             6 (Text)
        type             8 (Polyline)
        type             9 (Polygon)
        type             10 (Connection)
        """
        session = getNovaOrmSession()

        coordSet = (session.query(ModelCoordSet)
                    .filter(ModelCoordSet.name == DIST_WORLD)
                    .one())

        lookups = _EnmacImportLookups(coordSet.id)

        self._textParser = EnmacImportPprimText(lookups)
        self._polyParser = EnmacImportPprimPoly(lookups)
        self._connParser = EnmacImportPprimConn(lookups)
        self._ellipseParser = EnmacImportPprimEllipse(lookups)
        self._hotspotParser = EnmacImportPprimHotspot(lookups)
        self._dynamicParser = EnmacImportPprimDynamic(lookups)

        self.centerType = '7 (Centre Point)'
        self.hotSpotType = '3 (Hot Spot)'

        self._parsers = {'2 (Circle)': self._ellipseParser,
                         '3 (Hot Spot)': self._hotspotParser,
                         '4 (Line)': self._polyParser,
                         '5 (Symbol)': None,
                         '6 (Text)': self._textParser,
                         '13 (Text)': self._textParser,
                         '7 (Centre Point)': None,
                         '8 (Polyline)': self._polyParser,
                         '9 (Polygon)': self._polyParser,
                         '10 (Connection)': self._connParser}

        deferreds = []
        for fileName in os.listdir(D):
            if '&' in fileName:
                continue
            deferreds.append(deferToThread(self._loadDressing, D, fileName, coordSet.id))

        d = DeferredList(deferreds, fireOnOneErrback=True)
        d.addCallback(lambda _: deferToThread(self._createDressingGridIndex, coordSet.id))
        return d

    def _loadDressing(self, filePath, fileName, coordSetId):
        importGroupHash = fileName

        session = getNovaOrmSession()

        # Delete the existing display objects
        (session.query(DispBase)
         .filter(DispBase.importGroupHash == importGroupHash)
         .delete())

        session.commit()

        disps = []

        dispGroup = DispGroup()
        dispGroup.coordSetId = coordSetId
        dispGroup.name = fileName.replace('=', '/')
        dispGroup.importGroupHash = importGroupHash

        session.add(dispGroup)

        centerX = None
        centerY = None

        for section in self._loadSections(filePath, fileName):
            type = section['type']
            if type == self.centerType:
                centerX = float(section['start_x'])
                centerY = float(section['start_y'])
                continue

            parser = self._parsers[type]

            if not parser:
                continue

            items = parser.parse(section)

            # For hotspots, just take the first disp object
            if type == self.hotSpotType:
                items = items[0:1]

            # The text parser does return nothing if it so determines it should
            if len(items) == 0:
                continue

            assert len(items) == 1, "parser for type %s returned the wrong thing" % type

            disp, dynamics = items[0]
            assert len(dynamics) == 0

            if not disp:
                continue

            disp.coordSetId = coordSetId
            disp.importGroupHash = importGroupHash
            disps.append(disp)
            dispGroup.items.append(disp)
            session.add(disp)

        # Adjust all the shapes to be offsets of the center point
        for disp in disps:
            if not hasattr(disp, 'geom'):
                continue
            disp.geom = from_shape(translate(to_shape(disp.geom), -centerX, -centerY))

        session.commit()
        session.close()

    def _createDressingGridIndex(self, coordSetId):
        session = getNovaOrmSession()

        dispQry = (session.query(DispGroup)
                   .options(joinedload(DispGroup.items))
                   .all())

        session.expunge_all()

        newGridKeyIndexes = []
        for disp in dispQry:

            gridKeyIndex = GridKeyIndex()
            gridKeyIndex.gridKey = DRESSING_GRID_KEY
            gridKeyIndex.dispId = disp.id
            gridKeyIndex.coordSetId = disp.coordSetId
            gridKeyIndex.importGroupHash = DRESSING_GRID_KEY

            gridKeyIndex.dispJson = disp.tupleToSmallJsonDict()
            items = []
            for item in disp.items:
                items.append(item.tupleToSmallJsonDict())
            gridKeyIndex.dispJson['items'] = items
            gridKeyIndex.dispJson['gk'] = DRESSING_GRID_KEY

            newGridKeyIndexes.append(gridKeyIndex)

            if not (len(newGridKeyIndexes) % 1000):
                logger.debug("Loaded %s Grid Key Indexes" % len(newGridKeyIndexes))

        # Delete the existing grid index objects
        (session.query(GridKeyIndex)
         .filter(GridKeyIndex.importGroupHash == DRESSING_GRID_KEY)
         .delete())

        session.bulk_save_objects(newGridKeyIndexes)
        session.commit()
        session.close()

        session = getNovaOrmSession()

        # Mark these grids as updated
        existingGridKeyUpdateQry = (session.query(GridKeyIndexUpdate)
                                    .filter(
            GridKeyIndexUpdate.gridKey == DRESSING_GRID_KEY)
                                    .filter(GridKeyIndexUpdate.coordSetId == coordSetId))

        if existingGridKeyUpdateQry.count() != 0:
            existingGridKeyUpdateQry.one().lastUpdate = datetime.now(pytz.utc)
        else:
            session.add(GridKeyIndexUpdate(gridKey=DRESSING_GRID_KEY,
                                           lastUpdate=datetime.now(pytz.utc),
                                           coordSetId=coordSetId))

        session.commit()
        session.close()
