"""Added polygon isRectangle

Peek Plugin Database Migration Script

Revision ID: 6a71c73c0606
Revises: e8d6d02c0922
Create Date: 2019-06-03 22:12:09.814648

"""

# revision identifiers, used by Alembic.
revision = "6a71c73c0606"
down_revision = "e8d6d02c0922"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
import geoalchemy2


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "DispPolygon",
        sa.Column("isRectangle", sa.Boolean(), nullable=True),
        schema="pl_diagram",
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("DispPolygon", "isRectangle", schema="pl_diagram")
    # ### end Alembic commands ###
