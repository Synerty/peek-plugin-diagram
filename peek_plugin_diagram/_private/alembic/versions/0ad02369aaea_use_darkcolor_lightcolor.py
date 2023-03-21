"""use darkcolor lightcolor

Peek Plugin Database Migration Script

Revision ID: 0ad02369aaea
Revises: 0db3aedfee95
Create Date: 2022-10-20 15:56:02.384820

"""
from sqlalchemy.orm import Session

from peek_plugin_diagram._private.storage.Lookups import DispColor
from peek_plugin_diagram.tuples.ColorUtil import invertColor

# revision identifiers, used by Alembic.
revision = "0ad02369aaea"
down_revision = "0db3aedfee95"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.alter_column(
        "DispColor",
        "color",
        schema="pl_diagram",
        nullable=True,
        new_column_name="darkColor",
    )

    op.add_column(
        "DispColor",
        sa.Column("lightColor", sa.String(), nullable=True),
        schema="pl_diagram",
    )
    op.execute(
        """
        UPDATE pl_diagram."DispColor"
        SET "darkColor" = null
        WHERE "darkColor" = 'None'
        """
    )

    session = Session(bind=op.get_bind())
    rows = (
        session.query(DispColor).filter(DispColor.darkColor.isnot(None)).all()
    )

    for row in rows:
        row.lightColor = invertColor(row.darkColor, "#fff")
    session.commit()


def downgrade():
    op.drop_column("DispColor", "lightColor", schema="pl_diagram")
    op.alter_column(
        "DispColor",
        "darkColor",
        nullable=True,
        new_column_name="color",
        schema="pl_diagram",
    )
