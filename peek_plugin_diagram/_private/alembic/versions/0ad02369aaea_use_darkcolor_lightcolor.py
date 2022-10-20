"""use darkcolor lightcolor

Peek Plugin Database Migration Script

Revision ID: 0ad02369aaea
Revises: 0db3aedfee95
Create Date: 2022-10-20 15:56:02.384820

"""

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


def downgrade():
    op.drop_column("DispColor", "lightColor", schema="pl_diagram")
    op.alter_column(
        "DispColor",
        "darkColor",
        nullable=True,
        new_column_name="color",
        schema="pl_diagram",
    )
