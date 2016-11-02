import json

from peek.core.orm import getNovaOrmSession
from peek.core.orm.GridKeyIndex import GridKeyIndex


if __name__ == '__main__':
   with open('/tmp/disp', 'w') as f:

       items = [t[0]
                for t in getNovaOrmSession()
                    .query(GridKeyIndex.dispJson)
                    .yield_per(1000)]

       f.write(str(items))

