import logging
from datetime import datetime

from peek_plugin_base.worker import CeleryDbConn
from sqlalchemy import select
from txcelery.defer import DeferrableTask

from peek_plugin_diagram._private.storage.Display import DispBase
from peek_plugin_diagram._private.worker.CeleryApp import celeryApp
from vortex.SerialiseUtil import convertFromWkbElement

logger = logging.getLogger(__name__)


@DeferrableTask
@celeryApp.task(bind=True)
def bulkLoadDispsTask(self, coordSet, importGroupHash, disps, dispIdsToCompile):
    """ Import Disps Links

    1) Drop all disps with matching importGroupHash

    2) set the  coordSetId

    :param self: Celery reference to this task
    :param coordSet:
    :param importGroupHash:
    :param disps: An array of disp objects to import
    :param dispIdsToCompile: An array of import LiveDB Disp Links to import
    :return:
    """

    startTime = datetime.utcnow()

    dispTable = DispBase.__table__

    ormSession = CeleryDbConn.getDbSession()
    try:
        ormSession.execute(dispTable
                           .delete()
                           .where(dispTable.c.importGroupHash == importGroupHash))

        # Initialise the ModelCoordSet initial position if it's not set
        if (not coordSet.initialPanX
            and not coordSet.initialPanY
            and not coordSet.initialZoom):
            for disp in disps:
                if not hasattr(disp, 'geom'):
                    continue
                point = convertFromWkbElement(disp.geom)[0]
                coordSet.initialPanX = point['x']
                coordSet.initialPanY = point['y']
                coordSet.initialZoom = 0.05
                break

        ormSession.commit()

        # Make this change, it's required to store the WKBElements
        for disp in disps:
            disp.geom = disp.geom.desc

        with ormSession.begin(subtransactions=True):
            ormSession.bulk_save_objects(disps, update_changed_only=False)
        ormSession.commit()

        logger.info("Inserted %s Disps in %s",
                     len(disps), (datetime.utcnow() - startTime))

        if not dispIdsToCompile:
            result = ormSession.execute(
                select([dispTable.c.id])
                    .where(dispTable.c.importGroupHash == importGroupHash)
            )

            dispIdsToCompile = [o[0] for o in result.fetchall()]

        return dispIdsToCompile

    except Exception as e:
        ormSession.rollback()
        logger.exception(e)
        raise self.retry(exc=e, countdown=3)

    finally:
        ormSession.close()
