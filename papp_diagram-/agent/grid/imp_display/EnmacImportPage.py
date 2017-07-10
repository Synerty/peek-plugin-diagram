import hashlib
import logging
from base64 import b64encode
from collections import defaultdict
from datetime import datetime

import shapely
from geoalchemy2.shape import to_shape
from peek_agent_pof.imp_model.EnmacOrm import getEnmacSession, ComponentHeader, \
    ComponentAttribute, \
    ComponentClassDefn
from sqlalchemy.sql.expression import text
from twisted.internet import reactor
from twisted.internet.defer import Deferred
from twisted.internet.protocol import ProcessProtocol

from txhttputil import deferToThreadWrap
from .EnmacImportPprimConn import EnmacImportPprimConn
from .EnmacImportPprimDynamic import EnmacImportPprimDynamic
from .EnmacImportPprimEllipse import EnmacImportPprimEllipse
from .EnmacImportPprimHotspot import EnmacImportPprimHotspot
from .EnmacImportPprimPoly import EnmacImportPprimPoly
from .EnmacImportPprimText import EnmacImportPprimText

logger = logging.getLogger(__name__)

TEST_F = '00900088.txt'
D = '/media/psf/stash/pprims/'


class EnmacImportPage:
    """ Enmac PPrim Parse

    What do I want?

    I want to detect the deltas using a has of each item.

    I want to group symbols together.

    I want to parse each item
    """

    def __init__(self, worldName):
        self._worldName = worldName

        self._textParser = EnmacImportPprimText()
        self._polyParser = EnmacImportPprimPoly()
        self._connParser = EnmacImportPprimConn()
        self._ellipseParser = EnmacImportPprimEllipse()
        self._hotspotParser = EnmacImportPprimHotspot()
        self._dynamicParser = EnmacImportPprimDynamic()

        self._parsers = {'2 (Circle)': self._ellipseParser,
                         '3 (Hot Spot)': self._hotspotParser,
                         '4 (Line)': self._polyParser,
                         '5 (Symbol)': None,
                         '6 (Text)': self._textParser,
                         '7 (Centre Point)': None,
                         '13 (Text)': self._textParser,
                         '8 (Polyline)': self._polyParser,
                         '9 (Polygon)': self._polyParser,
                         '10 (Connection)': self._connParser}

    def import_(self, pageFilePath):

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

        deferred = Deferred()

        protocol = PPrimProtocol(pageFilePath, deferred)

        cmd = ['bash', '-l', '-c', "pprim %s" % pageFilePath]
        logger.debug("Running %s", ' '.join(cmd))
        reactor.spawnProcess(protocol, cmd[0], cmd)

        deferred.addCallback(self._filterVisiblePrimitivesFromOperationsAndPatches)

        deferred.addCallback(self._loadPage, pageFilePath)

        return deferred

    @deferToThreadWrap
    def _loadPage(self, pprimSections, pageFilePath):
        # logger.debug("Loading page %s%s" % (filePath, fileName))

        importGroupHash = pageFilePath

        disps = []
        dispLinks = []

        uniqueDispHashes = set()

        for section in pprimSections:

            parser = self._parsers[section['type']]

            if not parser:
                continue

            newItems = parser.parse(section)

            if not newItems:
                continue

            for disp, liveDbDispLinks in newItems:
                hasher = hashlib.sha256()
                hasher.update(pageFilePath)
                hasher.update(str(disp))
                hasher.update(disp.geom.desc)
                hasher.update(disp.tupleType())
                dispHash = b64encode(hasher.digest())

                if dispHash in uniqueDispHashes:
                    logger.warning("Overlapping display items %s:%s on page %s",
                                   section['type'], disp.tupleType(), pageFilePath)
                    continue

                uniqueDispHashes.add(dispHash)

                liveDbDispLinks.extend(self._dynamicParser.parse(section, disp))

                # Link the display item to the LiveDbLink
                for liveDbDispLink in liveDbDispLinks:
                    liveDbDispLink.importDispHash = dispHash
                    liveDbDispLink.importGroupHash = importGroupHash

                # SET GEOM FOR TRANSPORT
                if hasattr(disp, 'geom') and not isinstance(disp.geom, str):
                    disp.geom = b64encode(shapely.wkb.dumps(to_shape(disp.geom)))
                    disp.geomConverted = True

                # SET COORDSETNAME
                disp.coordSetId = None
                disp.importHash = dispHash
                disp.importGroupHash = importGroupHash
                disp.importLiveDbDispLinks = liveDbDispLinks

                dispLinks.extend(liveDbDispLinks)
                disps.append(disp)

                if not (len(disps) % 2000):
                    logger.debug("Loaded %s prims" % len(disps))

        self._convertDynamicLinks(dynamicLinks=dispLinks)

        return disps

    def _joinConns(self):
        pass

    def _convertDynamicLinks(self, dynamicLinks):
        def chunks():
            index = 0
            SIZE = 1000  # Max oracle IN clause limit
            while index < len(dynamicLinks):
                yield dynamicLinks[index:index + SIZE]
                index += SIZE

        for dynamicLinksChunk in chunks():
            self._convertDynamicLinkChunks(dynamicLinksChunk)

        return dynamicLinks

    def _convertDynamicLinkChunks(self, dynamicLinks):
        enmacSession = getEnmacSession()

        compIds = defaultdict(list)
        attrIds = defaultdict(list)

        # Sort the formats of keys, we could get CompID.attrName, or attrId
        # or attrId[row], or attrId[row][col]
        for link in dynamicLinks:
            if '[' in link.importKeyHash:
                logger.debug("Vector/Table attributes are not implemented yet %s"
                             % link.importKeyHash)
            elif "COMP" in link.importKeyHash:
                compIds[link.importKeyHash].append(link)

            elif "ATTR" in link.importKeyHash:
                attrIds[link.importKeyHash].append(link)

            else:
                logger.error("Can not convert liveDbKey |%s|", link.importKeyHash)
                # raise NotImplementedError

        if not compIds and not attrIds:
            return

        qry = (enmacSession.query(ComponentHeader.id, ComponentHeader.alias,
                                  ComponentAttribute.id, ComponentAttribute.name,
                                  ComponentClassDefn.appearance)
               .filter(ComponentHeader.id == ComponentAttribute.component_id)
               .filter(ComponentHeader.class_index == ComponentClassDefn.index)
               .yield_per(2000))

        if compIds:
            sql = text(("SELECT COMPONENT_ID\n"
                        "FROM COMPONENT_HEADER\n"
                        "WHERE COMPONENT_ID in (%s)\n"
                        ) % ', '.join(["'%s'" % v for v in compIds]))

            sub_qry = enmacSession.query(ComponentHeader.id)
            sub_qry = sub_qry.from_statement(sql)

            compQry = (qry.filter(ComponentHeader.id.in_(sub_qry))
                       .filter(ComponentAttribute.name == "State"))

            for result in compQry:
                for link in compIds[result[0]]:
                    if result[4]:
                        link.importKeyHash = result[2] + "|0|0"
                        link.props['actionAppearance'] = result[4]
                    else:
                        # If we have no action appearance, then there is no dressing
                        # and we don't need to load the key
                        link.importKeyHash = None
                        link.props['actionAppearance'] = None

        # Attribute IDs arn't required to be converted, they are already as we want them
        # if attrIds:
        #     sql = text(("SELECT ATTRIBUTE_ID\n"
        #                 "FROM COMPONENT_ATTRIBUTES\n"
        #                 "WHERE ATTRIBUTE_ID in (%s)\n"
        #                 ) % ', '.join(["'%s'" % v for v in attrIds]))
        #
        #     sub_qry = enmacSession.query(ComponentHeader.id)
        #     sub_qry = sub_qry.from_statement(sql)
        #
        #     attrQry = qry.filter(ComponentAttribute.id.in_(sub_qry))
        #
        #     for result in attrQry:
        #         for link in attrIds[result[2]]:
        #             link.importKeyHash = result[2]
        #             link.props['actionAppearance'] = result[4]

        enmacSession.close()

        logger.debug("Converted %s dynamicLinks" % len(dynamicLinks))

        return dynamicLinks

    @deferToThreadWrap
    def _filterVisiblePrimitivesFromOperationsAndPatches(self, pprimSections):
        ''' Filter Visible Overlays


            section['area'] == 0 # This primitive is not covered by any patch (normal)
            # All non-zero sections indicate that the primitive is covered by a patch
            # or that area is under revision by a patch.

            # The diagram editor can only edit area==0
            # Non-zero areas need to be edited via the patch editor.


            Grep of all overlays in a dist world
            # grep -e operation_char -e overlay ALL | sed 'N;s/\n/ /' | sort -u | less

            The non printable chars are just the server name with with the MSB bit set

          dynamic.attr.operation_char     '?'   dynamic.attr.overlay_symbol_type 1
          dynamic.attr.operation_char     'F'   dynamic.attr.overlay_symbol_type 0
          dynamic.attr.operation_char     'G'   dynamic.attr.overlay_symbol_type 0
          ...

          it seems :
          sym types 1,2,6 are only valid for operation chars with MSB set
          sym type 7 never has an operational id, no MSB set
          sym type 0 may or may nor have an operationId, no MSB set

          Sym Types
            7 = connection

          Overlays are provided for dressings, and patches.
          cuts and jumpers are also a form of a patch.

          area_number is the patch number
            0 = not related to a patch
            less than 0 = -1 * the patch number, this is the display BEFORE the patch
            more than 0 = the patch number, this is the display after the patch.


        '''
        startLen = len(pprimSections)
        startTime = datetime.utcnow()

        def getSectionOverlaySymbolType(section):
            symType = int(section["dynamic.attr.overlay_symbol_type"])
            return symType

        def getSectionPatchNumber(section):
            area = int(section["area_number"])
            return area

        def getOpCharNum(section):
            opChar = section["dynamic.attr.operation_char"].strip().strip("'")
            opNum = int(section["dynamic.attr.operation_number"])
            isMsbSet = False
            if opChar:
                isMsbSet = bool(128 & ord(opChar))
                opChar = chr(ord(opChar) & 127)

            return isMsbSet, opChar, opNum

        def getSectionOperationId(section):
            isMsbSet, opChar, opNum = getOpCharNum(section)

            if not opChar:
                return

            return '%s%08x%s' % (opChar, opNum, 'O') # O for Operation

        # Filter for strings
        operationIds = set([getSectionOperationId(s) for s in pprimSections])
        operationIds = [o for o in operationIds if isinstance(o, str)]

        if not operationIds:
            visibleOperationIds = set()

        else:
            enmacSession = getEnmacSession()
            sql = '''SELECT O.OPERATION_ID
                     FROM ACTION_DEFINITIONS A
                       JOIN ACTION_APPEARANCES AA
                          ON AA.NAME = A.ACTION_APPEARANCE
                            AND AA.VISIBLE_IN_REAL_WORLD = 'Y'
                       JOIN OPERATIONS O
                          ON O.ACTION = A.ACTION_NAME
                            AND O.CURRENT_STATE = AA.STATE
                     WHERE O.OPERATION_ID IN (%s)
                         --AND AA.VISIBLE_IN_REAL_WORLD = 'Y'
                  ''' % ', '.join(["'%s'" % v for v in operationIds])

            visibleOperationIds = set(
                [o[0] for o in enmacSession.execute(sql).fetchall()])
            enmacSession.close()


        def filt(section):
            # symbolType = getSectionOverlaySymbolType(section)
            isMsbSet, opChar, opNum = getOpCharNum(section)
            operationId = getSectionOperationId(section)
            area = getSectionPatchNumber(section)

            if area > 0:
                return False

            if isMsbSet:
                return True

            # if symbolType == 7:
            #     return True

            if operationId and operationId not in visibleOperationIds:
                return False

            return True

        pprimSections = [s for s in pprimSections if filt(s)]

        logger.debug("Filtered out %s non world visible overlays in %s",
                     startLen - len(pprimSections), datetime.utcnow() - startTime)

        return pprimSections


class PPrimProtocol(ProcessProtocol):
    SECTION_MARKER = '*' * 79
    SUBSECTION_MARKER = '-' * 79

    def __init__(self, pageFilePath, deferred):
        self.pageFilePath = pageFilePath
        self.deferred = deferred

        self.pprimSections = []

        self.outData = ""
        self.errData = ""

    def connectionMade(self):
        pass

    def outReceived(self, data):
        """
        Some data was received from stdout.
        """
        self.outData += data

    def errReceived(self, data):
        """
        Some data was received from stderr.
        """
        self.errData += data

    def processEnded(self, status):
        rc = status.value.exitCode
        if rc == 0:
            self.deferred.callback(self._loadSections())
        elif rc == 1:
            logger.warning("Failed to import page %s\n%s", self.pageFilePath,
                           self.errData)
            # self.deferred.callback([])
            self.deferred.errback(status)
        else:
            logger.critical("Failed to import page %s\n%s", self.pageFilePath,
                            self.errData)
            self.deferred.errback(status)

    def _loadSections(self):
        pprimSections = []
        sectionData = {}
        for line in self.outData.splitlines():
            line = line.strip()
            if not line or line == self.SUBSECTION_MARKER:
                continue

            if line == self.SECTION_MARKER:
                if len(sectionData) > 5:
                    pprimSections.append(sectionData)
                sectionData = {}
                continue

            try:
                if not ' ' in line:
                    if not '\t' in line:
                        key, val = line.strip(), None
                    else:
                        key, val = line.split('\t', 1)
                        val = val.strip()
                else:
                    key, val = [item.strip() for item in line.split(' ', 1)]
                    val = val.strip()

            except:
                print(line)
                raise

            sectionData[key] = val

        if len(sectionData) > 5:
            pprimSections.append(sectionData)

        return pprimSections
