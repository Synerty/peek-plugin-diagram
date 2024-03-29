"""add disp action

Peek Plugin Database Migration Script

Revision ID: 42a8dc25e588
Revises: f697025b2013
Create Date: 2020-05-10 15:20:02.102210

"""

# revision identifiers, used by Alembic.
revision = "42a8dc25e588"
down_revision = "f697025b2013"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
import geoalchemy2


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "DispBase",
        sa.Column("action", sa.SmallInteger(), nullable=True),
        schema="pl_diagram",
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("DispBase", "action", schema="pl_diagram")
    # ### end Alembic commands ###
