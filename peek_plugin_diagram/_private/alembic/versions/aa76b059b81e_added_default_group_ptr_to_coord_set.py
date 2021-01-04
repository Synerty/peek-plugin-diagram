"""Added default group ptr to coord set

Peek Plugin Database Migration Script

Revision ID: aa76b059b81e
Revises: d66cda728b26
Create Date: 2019-05-26 16:00:44.664243

"""

# revision identifiers, used by Alembic.
revision = "aa76b059b81e"
down_revision = "f4dce3e782ec"
branch_labels = None
depends_on = None

import sqlalchemy as sa
from alembic import op


def upgrade():
    op.add_column(
        "DispGroupPointer",
        sa.Column(
            "targetDispGroupName", sa.String(), server_default="0", nullable=True
        ),
        schema="pl_diagram",
    )

    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "ModelCoordSet",
        sa.Column("editDefaultEdgeCoordSetId", sa.Integer(), nullable=True),
        schema="pl_diagram",
    )
    op.add_column(
        "ModelCoordSet",
        sa.Column("editDefaultEdgeGroupName", sa.String(), nullable=True),
        schema="pl_diagram",
    )
    op.add_column(
        "ModelCoordSet",
        sa.Column("editDefaultVertexCoordSetId", sa.Integer(), nullable=True),
        schema="pl_diagram",
    )
    op.add_column(
        "ModelCoordSet",
        sa.Column("editDefaultVertexGroupName", sa.String(), nullable=True),
        schema="pl_diagram",
    )
    op.create_index(
        "idxCoordModel_editDefaultEdgeCoordSetId",
        "ModelCoordSet",
        ["editDefaultEdgeCoordSetId"],
        unique=False,
        schema="pl_diagram",
    )
    op.create_index(
        "idxCoordModel_editDefaultVertexCoordSetId",
        "ModelCoordSet",
        ["editDefaultVertexCoordSetId"],
        unique=False,
        schema="pl_diagram",
    )
    op.create_foreign_key(
        "ModelCoordSet_editDefaultEdgeCoordSetId_fkey",
        "ModelCoordSet",
        "ModelCoordSet",
        ["editDefaultEdgeCoordSetId"],
        ["id"],
        source_schema="pl_diagram",
        referent_schema="pl_diagram",
    )
    op.create_foreign_key(
        "ModelCoordSet_editDefaultVertexCoordSetId_fkey",
        "ModelCoordSet",
        "ModelCoordSet",
        ["editDefaultVertexCoordSetId"],
        ["id"],
        source_schema="pl_diagram",
        referent_schema="pl_diagram",
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(
        "ModelCoordSet_editDefaultVertexCoordSetId_fkey",
        "ModelCoordSet",
        schema="pl_diagram",
        type_="foreignkey",
    )
    op.drop_constraint(
        "ModelCoordSet_editDefaultEdgeCoordSetId_fkey",
        "ModelCoordSet",
        schema="pl_diagram",
        type_="foreignkey",
    )
    op.drop_index(
        "idxCoordModel_editDefaultVertexCoordSetId",
        table_name="ModelCoordSet",
        schema="pl_diagram",
    )
    op.drop_index(
        "idxCoordModel_editDefaultEdgeCoordSetId",
        table_name="ModelCoordSet",
        schema="pl_diagram",
    )
    op.drop_column("ModelCoordSet", "editDefaultVertexGroupName", schema="pl_diagram")
    op.drop_column("ModelCoordSet", "editDefaultVertexCoordSetId", schema="pl_diagram")
    op.drop_column("ModelCoordSet", "editDefaultEdgeGroupName", schema="pl_diagram")
    op.drop_column("ModelCoordSet", "editDefaultEdgeCoordSetId", schema="pl_diagram")
    op.drop_column("DispGroupPointer", "name", schema="pl_diagram")
    # ### end Alembic commands ###
