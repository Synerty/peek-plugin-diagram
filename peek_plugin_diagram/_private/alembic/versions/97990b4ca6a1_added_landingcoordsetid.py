"""Added landingCoordSetId

Peek Plugin Database Migration Script

Revision ID: 97990b4ca6a1
Revises: da424430bf97
Create Date: 2019-07-26 13:24:14.505584

"""

# revision identifiers, used by Alembic.
revision = "97990b4ca6a1"
down_revision = "da424430bf97"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
import geoalchemy2


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "ModelSet",
        sa.Column("landingCoordSetId", sa.Integer(), nullable=True),
        schema="pl_diagram",
    )
    op.create_foreign_key(
        None,
        "ModelSet",
        "ModelCoordSet",
        ["landingCoordSetId"],
        ["id"],
        source_schema="pl_diagram",
        referent_schema="pl_diagram",
        ondelete="CASCADE",
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(
        None, "ModelSet", schema="pl_diagram", type_="foreignkey"
    )
    op.drop_column("ModelSet", "landingCoordSetId", schema="pl_diagram")
    # ### end Alembic commands ###
