"""Fixed hashId index

Peek Plugin Database Migration Script

Revision ID: d66cda728b26
Revises: f4dce3e782ec
Create Date: 2019-05-24 11:35:34.425082

"""

# revision identifiers, used by Alembic.
revision = 'd66cda728b26'
down_revision = 'f4dce3e782ec'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
import geoalchemy2


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_index('idx_Disp_hashId', 'DispBase', ['coordSetId', 'hashId'], unique=True, schema='pl_diagram')
    op.drop_index('idx_Disp_replacesHashId', table_name='DispBase', schema='pl_diagram')
    op.create_index('idx_Disp_replacesHashId', 'DispBase', ['replacesHashId'], unique=False, schema='pl_diagram')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index('idx_Disp_replacesHashId', table_name='DispBase', schema='pl_diagram')
    op.create_index('idx_Disp_replacesHashId', 'DispBase', ['coordSetId', 'hashId'], unique=True, schema='pl_diagram')
    op.drop_index('idx_Disp_hashId', table_name='DispBase', schema='pl_diagram')
    # ### end Alembic commands ###