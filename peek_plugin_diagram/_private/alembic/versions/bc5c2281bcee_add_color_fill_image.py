"""Add color fill image

Peek Plugin Database Migration Script

Revision ID: bc5c2281bcee
Revises: ebcb7ce2ed21
Create Date: 2023-10-13 19:53:38.908637

"""

# revision identifiers, used by Alembic.
revision = "bc5c2281bcee"
down_revision = "ebcb7ce2ed21"
branch_labels = None
depends_on = None

import sqlalchemy as sa
from alembic import op


def upgrade():
    op.add_column(
        "DispColor",
        sa.Column("darkFillBase64Image", sa.String()),
        schema="pl_diagram",
    )

    op.add_column(
        "DispColor",
        sa.Column("lightFillBase64Image", sa.String()),
        schema="pl_diagram",
    )


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("DispColor", "darkFillBase64Image", schema="pl_diagram")
    op.drop_column("DispColor", "lightFillBase64Image", schema="pl_diagram")
    # ### end Alembic commands ###
