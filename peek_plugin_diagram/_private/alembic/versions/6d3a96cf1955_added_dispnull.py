"""Added DispNull

Peek Plugin Database Migration Script

Revision ID: 6d3a96cf1955
Revises: aa76b059b81e
Create Date: 2019-05-29 10:51:00.872234

"""

# revision identifiers, used by Alembic.
revision = "6d3a96cf1955"
down_revision = "aa76b059b81e"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
import geoalchemy2


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "DispNull",
        sa.Column("id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("geomJson", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(
            ["id"], ["pl_diagram.DispBase.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        schema="pl_diagram",
    )


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("DispNull", schema="pl_diagram")
    # ### end Alembic commands ###
