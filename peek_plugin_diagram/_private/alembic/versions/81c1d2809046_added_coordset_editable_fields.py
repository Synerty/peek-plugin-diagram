"""Added CoordSet editable fields

Peek Plugin Database Migration Script

Revision ID: 81c1d2809046
Revises: bf8f559c4df9
Create Date: 2019-05-13 21:08:31.486845

"""

# revision identifiers, used by Alembic.
revision = "81c1d2809046"
down_revision = "bf8f559c4df9"
branch_labels = None
depends_on = None

import sqlalchemy as sa
from alembic import op


def upgrade():
    op.alter_column(
        "ModelCoordSet",
        "enabled",
        type_=sa.Boolean(),
        server_default="true",
        schema="pl_diagram",
    )

    op.execute('UPDATE "pl_diagram"."ModelCoordSet" SET "enabled" = true ')

    op.add_column(
        "ModelCoordSet",
        sa.Column(
            "editEnabled", sa.Boolean(), server_default="false", nullable=True
        ),
        schema="pl_diagram",
    )

    op.execute('UPDATE "pl_diagram"."ModelCoordSet" SET "editEnabled" = false ')

    op.alter_column(
        "ModelCoordSet",
        "editEnabled",
        type_=sa.Boolean(),
        nullable=False,
        schema="pl_diagram",
    )

    op.add_column(
        "ModelCoordSet",
        sa.Column(
            "branchesEnabled",
            sa.Boolean(),
            server_default="false",
            nullable=True,
        ),
        schema="pl_diagram",
    )

    op.execute(
        'UPDATE "pl_diagram"."ModelCoordSet" SET "branchesEnabled" = false'
    )

    op.alter_column(
        "ModelCoordSet",
        "branchesEnabled",
        type_=sa.Boolean(),
        nullable=False,
        schema="pl_diagram",
    )

    op.add_column(
        "ModelCoordSet",
        sa.Column("editDefaultColorId", sa.Integer(), nullable=True),
        schema="pl_diagram",
    )

    op.add_column(
        "ModelCoordSet",
        sa.Column("editDefaultLayerId", sa.Integer(), nullable=True),
        schema="pl_diagram",
    )

    op.add_column(
        "ModelCoordSet",
        sa.Column("editDefaultLevelId", sa.Integer(), nullable=True),
        schema="pl_diagram",
    )

    op.add_column(
        "ModelCoordSet",
        sa.Column("editDefaultLineStyleId", sa.Integer(), nullable=True),
        schema="pl_diagram",
    )

    op.add_column(
        "ModelCoordSet",
        sa.Column("editDefaultTextStyleId", sa.Integer(), nullable=True),
        schema="pl_diagram",
    )

    op.create_index(
        "idxCoordModel_editDefaultColorId",
        "ModelCoordSet",
        ["editDefaultColorId"],
        unique=False,
        schema="pl_diagram",
    )

    op.create_index(
        "idxCoordModel_editDefaultLayerId",
        "ModelCoordSet",
        ["editDefaultLayerId"],
        unique=False,
        schema="pl_diagram",
    )

    op.create_index(
        "idxCoordModel_editDefaultLevelId",
        "ModelCoordSet",
        ["editDefaultLevelId"],
        unique=False,
        schema="pl_diagram",
    )

    op.create_index(
        "idxCoordModel_editDefaultLineStyleId",
        "ModelCoordSet",
        ["editDefaultLineStyleId"],
        unique=False,
        schema="pl_diagram",
    )

    op.create_index(
        "idxCoordModel_editDefaultTextStyleId",
        "ModelCoordSet",
        ["editDefaultTextStyleId"],
        unique=False,
        schema="pl_diagram",
    )

    op.create_foreign_key(
        "ModelCoordSet_editDefaultLineStyleId_fkey",
        "ModelCoordSet",
        "DispLineStyle",
        ["editDefaultLineStyleId"],
        ["id"],
        source_schema="pl_diagram",
        referent_schema="pl_diagram",
    )

    op.create_foreign_key(
        "ModelCoordSet_editDefaultColorId_fkey",
        "ModelCoordSet",
        "DispColor",
        ["editDefaultColorId"],
        ["id"],
        source_schema="pl_diagram",
        referent_schema="pl_diagram",
    )

    op.create_foreign_key(
        "ModelCoordSet_editDefaultLayerId_fkey",
        "ModelCoordSet",
        "DispLayer",
        ["editDefaultLayerId"],
        ["id"],
        source_schema="pl_diagram",
        referent_schema="pl_diagram",
    )

    op.create_foreign_key(
        "ModelCoordSet_editDefaultLevelId_fkey",
        "ModelCoordSet",
        "DispLevel",
        ["editDefaultLevelId"],
        ["id"],
        source_schema="pl_diagram",
        referent_schema="pl_diagram",
    )

    op.create_foreign_key(
        "ModelCoordSet_editDefaultTextStyleId_fkey",
        "ModelCoordSet",
        "DispTextStyle",
        ["editDefaultTextStyleId"],
        ["id"],
        source_schema="pl_diagram",
        referent_schema="pl_diagram",
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(
        "ModelCoordSet_editDefaultLineStyleId_fkey",
        "ModelCoordSet",
        schema="pl_diagram",
        type_="foreignkey",
    )
    op.drop_constraint(
        "ModelCoordSet_editDefaultColorId_fkey",
        "ModelCoordSet",
        schema="pl_diagram",
        type_="foreignkey",
    )
    op.drop_constraint(
        "ModelCoordSet_editDefaultLayerId_fkey",
        "ModelCoordSet",
        schema="pl_diagram",
        type_="foreignkey",
    )
    op.drop_constraint(
        "ModelCoordSet_editDefaultLevelId_fkey",
        "ModelCoordSet",
        schema="pl_diagram",
        type_="foreignkey",
    )
    op.drop_constraint(
        "ModelCoordSet_editDefaultTextStyleId_fkey",
        "ModelCoordSet",
        schema="pl_diagram",
        type_="foreignkey",
    )

    op.drop_index(
        "idxCoordModel_editDefaultTextStyleId",
        table_name="ModelCoordSet",
        schema="pl_diagram",
    )
    op.drop_index(
        "idxCoordModel_editDefaultLineStyleId",
        table_name="ModelCoordSet",
        schema="pl_diagram",
    )
    op.drop_index(
        "idxCoordModel_editDefaultLevelId",
        table_name="ModelCoordSet",
        schema="pl_diagram",
    )
    op.drop_index(
        "idxCoordModel_editDefaultLayerId",
        table_name="ModelCoordSet",
        schema="pl_diagram",
    )
    op.drop_index(
        "idxCoordModel_editDefaultColorId",
        table_name="ModelCoordSet",
        schema="pl_diagram",
    )
    op.drop_column("ModelCoordSet", "branchesEnabled", schema="pl_diagram")
    op.drop_column("ModelCoordSet", "editEnabled", schema="pl_diagram")
    op.drop_column(
        "ModelCoordSet", "editDefaultTextStyleId", schema="pl_diagram"
    )
    op.drop_column(
        "ModelCoordSet", "editDefaultLineStyleId", schema="pl_diagram"
    )
    op.drop_column("ModelCoordSet", "editDefaultLevelId", schema="pl_diagram")
    op.drop_column("ModelCoordSet", "editDefaultLayerId", schema="pl_diagram")
    op.drop_column("ModelCoordSet", "editDefaultColorId", schema="pl_diagram")
    # ### end Alembic commands ###
