from sqlalchemy import Column, Integer, Index

from peek_plugin_diagram._private.storage.DeclarativeBase import DeclarativeBase


class DispIndexerQueue(DeclarativeBase):
    __tablename__ = 'DispCompilerQueue'

    id = Column(Integer, primary_key=True, autoincrement=True)
    dispId = Column(Integer, primary_key=True)

    __table_args__ = (
        Index("idx_DispCompQueue_dispId", dispId, unique=False),
    )
