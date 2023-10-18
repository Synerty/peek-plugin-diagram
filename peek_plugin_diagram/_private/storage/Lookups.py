import json
import logging
import typing
from typing import Callable

from hashids import Hashids
from sqlalchemy import Boolean
from sqlalchemy import Column
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import Index
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy.orm import relationship
from vortex.Tuple import JSON_EXCLUDE
from vortex.Tuple import Tuple
from vortex.Tuple import TupleField
from vortex.Tuple import addTupleType

from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from peek_plugin_diagram._private.storage.DeclarativeBase import DeclarativeBase
from peek_plugin_diagram._private.storage.ModelSet import ModelCoordSet
from peek_plugin_diagram._private.storage.ModelSet import ModelSet
from peek_plugin_diagram.tuples.ColorUtil import invertColor
from peek_plugin_diagram.tuples.lookup_tuples.ShapeColorTuple import (
    ShapeColorTuple,
)
from peek_plugin_diagram.tuples.lookup_tuples.ShapeLayerTuple import (
    ShapeLayerTuple,
)
from peek_plugin_diagram.tuples.lookup_tuples.ShapeLineStyleTuple import (
    ShapeLineStyleTuple,
)
from peek_plugin_diagram.tuples.lookup_tuples.ShapeTextStyleTuple import (
    ShapeTextStyleTuple,
)

logger = logging.getLogger(__name__)


class _Hasher:
    def __init__(self):
        self._hashids = Hashids(salt="7013b24ca9ff46188a1fbbb1fd0129e1")

    @property
    def encode(self) -> Callable:
        return self._hashids.encode

    @property
    def decode(self) -> Callable:
        return self._hashids.decode


_hasher = _Hasher()


@addTupleType
class DispLayer(Tuple, DeclarativeBase):
    __tablename__ = "DispLayer"
    __tupleTypeShort__ = "DLA"
    __tupleType__ = diagramTuplePrefix + __tablename__

    #: Misc data holder
    data = TupleField()

    #: Key field used to abstract ID for APIs with other plugins
    key = TupleField()
    modelSetKey = TupleField()

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    order = Column(Integer, nullable=False, server_default="0")
    selectable = Column(Boolean, nullable=False, server_default="false")
    visible = Column(Boolean, nullable=False, server_default="true")
    opacity = Column(Float, nullable=False, server_default="1")

    modelSetId = Column(
        Integer, ForeignKey("ModelSet.id", ondelete="CASCADE"), nullable=False
    )
    modelSet = relationship(ModelSet)

    importHash = Column(String(100), doc=JSON_EXCLUDE)

    showForEdit = Column(Boolean, nullable=False)

    blockApiUpdate = Column(Boolean, nullable=False)

    __table_args__: typing.Tuple = (
        Index("idx_DispLayer_modelSetId", modelSetId, unique=False),
        Index("idx_DispLayer_importHash", modelSetId, importHash, unique=True),
    )

    def setTupleFields(self) -> None:
        self.modelSetKey = self.modelSet.key
        self.data = {"modelSetKey": self.modelSet.key}
        self.key = _hasher.encode(self.id)

    def toTuple(self) -> "ShapeLayerTuple":
        self.setTupleFields()
        tuple_ = ShapeLayerTuple()

        tuple_.data = self.data
        tuple_.key = self.key
        tuple_.modelSetKey = self.modelSetKey

        tuple_.name = self.name
        tuple_.order = self.order
        tuple_.selectable = self.selectable
        tuple_.visible = self.visible
        tuple_.opacity = self.opacity
        tuple_.importHash = self.importHash
        tuple_.blockApiUpdate = self.blockApiUpdate
        tuple_.showForEdit = self.showForEdit

        return tuple_


@addTupleType
class DispLevel(Tuple, DeclarativeBase):
    __tablename__ = "DispLevel"
    __tupleTypeShort__ = "DLE"
    __tupleType__ = diagramTuplePrefix + __tablename__

    #: Misc data holder
    data = TupleField()

    #: Key field used to abstract ID for APIs with other plugins
    key = TupleField()
    modelSetKey = TupleField()
    coordSetKey = TupleField()

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    order = Column(Integer, nullable=False, server_default="0")
    minZoom = Column(Float)
    maxZoom = Column(Float)

    coordSetId = Column(
        Integer,
        ForeignKey("ModelCoordSet.id", ondelete="CASCADE"),
        nullable=False,
    )
    coordSet = relationship(ModelCoordSet, foreign_keys=[coordSetId])

    importHash = Column(String(100), doc=JSON_EXCLUDE)

    showForEdit = Column(Boolean, nullable=False)

    blockApiUpdate = Column(Boolean, nullable=False)

    __table_args__ = (
        Index("idx_DispLevel_coordSetId", coordSetId, unique=False),
        Index("idx_DispLevel_importHash", coordSetId, importHash, unique=True),
    )

    def setTupleFields(self) -> None:
        self.modelSetKey = self.coordSet.modelSet.key
        self.coordSetKey = self.coordSet.key
        self.data = {
            "modelSetKey": self.coordSet.modelSet.key,
            "coordSetKey": self.coordSet.key,
        }
        self.key = _hasher.encode(self.id)

    def isVisibleAtZoom(self, zoom: float) -> bool:
        return self.minZoom <= zoom < self.maxZoom

    def toTuple(self):
        self.setTupleFields()
        tuple_ = ShapeLayerTuple()

        tuple_.data = self.data
        tuple_.key = self.key
        tuple_.modelSetKey = self.modelSetKey
        tuple_.coordSetKey = self.coordSetKey

        tuple_.name = self.name
        tuple_.order = self.order
        tuple_.minZoom = self.minZoom
        tuple_.maxZoom = self.maxZoom
        tuple_.importHash = self.importHash
        tuple_.showForEdit = self.showForEdit
        tuple_.blockApiUpdate = self.blockApiUpdate

        return tuple_


@addTupleType
class DispTextStyle(Tuple, DeclarativeBase):
    __tupleTypeShort__ = "DTS"
    __tablename__ = "DispTextStyle"
    __tupleType__ = diagramTuplePrefix + __tablename__

    #: Misc data holder
    data = TupleField()

    #: Key field used to abstract ID for APIs with other plugins
    key = TupleField()
    modelSetKey = TupleField()

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    fontName = Column(String, nullable=False, server_default="GillSans")
    fontSize = Column(Integer, nullable=False, server_default="9")
    fontStyle = Column(String)
    scalable = Column(Boolean, nullable=False, server_default="true")
    scaleFactor = Column(Integer, nullable=False, server_default="1")
    spacingBetweenTexts = Column(
        Float, nullable=False, server_default="100", default=100
    )

    modelSetId = Column(
        Integer,
        ForeignKey("ModelSet.id", ondelete="CASCADE"),
        doc=JSON_EXCLUDE,
        nullable=False,
    )
    modelSet = relationship(ModelSet)

    importHash = Column(String(100), doc=JSON_EXCLUDE)

    borderWidth = Column(Float, nullable=True)

    showForEdit = Column(Boolean, nullable=False)

    blockApiUpdate = Column(Boolean, nullable=False)

    wrapTextAtChars = Column(Integer, nullable=True)

    wrapTextAtCharSplitBetweenWords = Column(
        Boolean, nullable=False, default=True
    )

    __table_args__ = (
        Index("idx_DispTextStyle_modelSetId", modelSetId, unique=False),
        Index(
            "idx_DispTextStyle_importHash", modelSetId, importHash, unique=True
        ),
    )

    def setTupleFields(self) -> None:
        self.modelSetKey = self.modelSet.key
        self.data = {"modelSetKey": self.modelSet.key}
        self.key = _hasher.encode(self.id)

    def toTuple(self):
        self.setTupleFields()
        tuple_ = ShapeTextStyleTuple()

        tuple_.data = self.data
        tuple_.key = self.key
        tuple_.modelSetKey = self.modelSetKey

        tuple_.name = self.name
        tuple_.fontName = self.fontName
        tuple_.fontSize = self.fontSize
        tuple_.fontStyle = self.fontStyle
        tuple_.scalable = self.scalable
        tuple_.scaleFactor = self.scaleFactor
        tuple_.importHash = self.importHash
        tuple_.spacingBetweenTexts = self.spacingBetweenTexts
        tuple_.borderWidth = self.borderWidth
        tuple_.blockApiUpdate = self.blockApiUpdate
        tuple_.showForEdit = self.showForEdit
        tuple_.wrapTextAtChars = self.wrapTextAtChars
        tuple_.wrapTextAtCharSplitBetweenWords = (
            self.wrapTextAtCharSplitBetweenWords
        )

        return tuple_


@addTupleType
class DispLineStyle(Tuple, DeclarativeBase):
    __tupleTypeShort__ = "DLS"
    __tablename__ = "DispLineStyle"
    __tupleType__ = diagramTuplePrefix + __tablename__

    #: Misc data holder
    data = TupleField()

    #: Key field used to abstract ID for APIs with other plugins
    key = TupleField()
    modelSetKey = TupleField()

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    backgroundFillDashSpace = Column(
        Boolean, nullable=False, server_default="false"
    )
    capStyle = Column(String(15), nullable=False)
    joinStyle = Column(String(15), nullable=False)
    dashPattern = Column(String)
    startArrowSize = Column(Integer)
    endArrowSize = Column(Integer)
    winStyle = Column(Integer, nullable=False)

    modelSetId = Column(
        Integer,
        ForeignKey("ModelSet.id", ondelete="CASCADE"),
        doc=JSON_EXCLUDE,
        nullable=False,
    )
    modelSet = relationship(ModelSet)

    importHash = Column(String(100), doc=JSON_EXCLUDE)
    scalable = Column(Boolean, nullable=False, server_default="false")

    showForEdit = Column(Boolean, nullable=False)
    blockApiUpdate = Column(Boolean, nullable=False)

    __table_args__ = (
        Index("idx_DispLineStyle_modelSetId", modelSetId, unique=False),
        Index(
            "idx_DispLineStyle_importHash", modelSetId, importHash, unique=True
        ),
    )

    @property
    def makeData(self) -> dict:
        return {"modelSetKey": self.modelSet.key}

    @property
    def makeKey(self) -> str:
        return _hasher.encode(self.id)

    @property
    def dashPatternParsed(self):
        if self.dashPattern is None:
            return None
        return json.loads(self.dashPattern)

    def setTupleFields(self):
        self.modelSetKey = self.modelSet.key
        self.data = {"modelSetKey": self.modelSet.key}
        self.key = _hasher.encode(self.id)

    def toTuple(self):
        self.setTupleFields()
        tuple_ = ShapeLineStyleTuple()

        tuple_.data = self.data
        tuple_.key = self.key
        tuple_.modelSetKey = self.modelSetKey

        tuple_.name = self.name
        tuple_.backgroundFillDashSpace = self.backgroundFillDashSpace
        tuple_.capStyle = self.capStyle
        tuple_.joinStyle = self.joinStyle
        tuple_.dashPattern = self.dashPattern
        tuple_.startArrowSize = self.startArrowSize
        tuple_.endArrowSize = self.endArrowSize
        tuple_.winStyle = self.winStyle
        tuple_.importHash = self.importHash
        tuple_.scalable = self.scalable
        tuple_.showForEdit = self.showForEdit
        tuple_.blockApiUpdate = self.blockApiUpdate

        return tuple_


@addTupleType
class DispColor(Tuple, DeclarativeBase):
    __tupleTypeShort__ = "DC"
    __tablename__ = "DispColor"
    __tupleType__ = diagramTuplePrefix + __tablename__

    #: Misc data holder
    data = TupleField()

    #: Key field used to abstract ID for APIs with other plugins
    key = TupleField()
    modelSetKey = TupleField()

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, doc=JSON_EXCLUDE, nullable=False)
    darkColor = Column(String(20), server_default="orange")
    lightColor = Column(String(20), server_default="orange")
    darkFillBase64Image = Column(String)
    lightFillBase64Image = Column(String)
    altColor = Column(String(20))
    swapPeriod = Column(Float)

    modelSetId = Column(
        Integer,
        ForeignKey("ModelSet.id", ondelete="CASCADE"),
        doc=JSON_EXCLUDE,
        nullable=False,
    )
    modelSet = relationship(ModelSet)

    importHash = Column(String(100), doc=JSON_EXCLUDE)

    showForEdit = Column(Boolean, nullable=False)

    blockApiUpdate = Column(Boolean, nullable=False)

    __table_args__ = (
        Index("idx_DispColor_modelSetId", modelSetId, unique=False),
        Index("idx_DispColor_importHash", modelSetId, importHash, unique=True),
    )

    def setTupleFields(self) -> None:
        self.modelSetKey = self.modelSet.key
        self.data = {"modelSetKey": self.modelSet.key}
        self.key = _hasher.encode(self.id)

    @property
    def color(self):
        logger.warning("Accessing depreciated color property")
        return self.darkColor

    @color.setter
    def color(self, value: str):
        logger.warning("Setting depreciated color property")
        self.darkColor = value
        if value:
            self.lightColor = invertColor(value, "#fff")

    def toTuple(self):
        self.setTupleFields()
        tuple_ = ShapeColorTuple()

        tuple_.data = self.data
        tuple_.key = self.key
        tuple_.modelSetKey = self.modelSetKey

        tuple_.name = self.name
        tuple_.darkColor = self.darkColor
        tuple_.lightColor = self.lightColor
        tuple_.darkFillBase64Image = self.darkFillBase64Image
        tuple_.lightFillBase64Image = self.lightFillBase64Image
        tuple_.altColor = self.altColor
        tuple_.swapPeriod = self.swapPeriod
        tuple_.importHash = self.importHash
        tuple_.showForEdit = self.showForEdit
        tuple_.blockApiUpdate = self.blockApiUpdate
        tuple_.color = self.color

        return tuple_
