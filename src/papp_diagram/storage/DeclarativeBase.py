""" 
 * orm.Base.py
 *
 *  Copyright Synerty Pty Ltd 2013
 *
 *  This software is proprietary, you are not free to copy
 *  or redistribute this code in any format.
 *
 *  All rights to this software are reserved by 
 *  Synerty Pty Ltd
 *
"""

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy.schema import MetaData

metadata = MetaData(schema="papp_diagram")
DeclarativeBase = declarative_base(metadata=metadata)

#
# class BaseMixin(object):
#
#
#   def fieldNames(self):
#     cols = []
#     for attr in self._sa_class_manager.values():
#       if isinstance(attr.property, ColumnProperty):
#         cols.append(attr.property)
#     return cols
#
#
#   def columnObjectsDict(self):
#     cols = {}
#     for col in self.fieldNames():
#       cols[col._orig_columns[0].key] = col
#     return cols
#
#   def isEqual(self, other):
#     ''' Is Equal
#     Compares the entire data of self against other.
#     @return: True if the data is the same, else False
#     '''
#
#     assert(self.__class__ == other.__class__)
#
#     for col in self.fieldNames():
#       selfVal = getattr(self, col.key)
#       otherVal = getattr(other, col.key)
#
#       if selfVal != otherVal:
#         return False
#
#     return True
#
#   def isDataValid(self):
#     return True
