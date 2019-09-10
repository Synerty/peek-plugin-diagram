"""coordSet.positionOnZoom

Peek Plugin Database Migration Script

Revision ID: a73574690197
Revises: 3b41dec74e46
Create Date: 2019-08-12 13:06:03.511202

"""

# revision identifiers, used by Alembic.
revision = 'a73574690197'
down_revision = '3b41dec74e46'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
import geoalchemy2


def upgrade():
    op.add_column('ModelCoordSet', sa.Column('positionOnZoom', sa.Float(), server_default='2.0', nullable=True), schema='pl_diagram')

    op.execute('''
        UPDATE pl_diagram."ModelCoordSet"
        SET "positionOnZoom"=2.0
    ''')

    op.alter_column('ModelCoordSet', 'positionOnZoom', type_=sa.Float(), nullable=False, schema='pl_diagram')


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('ModelCoordSet', 'positionOnZoom', schema='pl_diagram')
    # ### end Alembic commands ###