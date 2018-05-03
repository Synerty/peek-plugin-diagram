"""Added cascade constraints

Peek Plugin Database Migration Script

Revision ID: 5e2f84d757f2
Revises: cea17a52b9ae
Create Date: 2018-05-03 16:49:27.699014

"""

# revision identifiers, used by Alembic.
revision = '5e2f84d757f2'
down_revision = 'cea17a52b9ae'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
import geoalchemy2


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('GridKeyIndex_coordSetId_fkey', 'GridKeyIndex', schema='pl_diagram', type_='foreignkey')
    op.create_foreign_key('GridKeyIndex_coordSetId_fkey', 'GridKeyIndex', 'ModelCoordSet', ['coordSetId'], ['id'], source_schema='pl_diagram', referent_schema='pl_diagram', ondelete='CASCADE')
    op.drop_constraint('LiveDbDispLink_coordSetId_fkey', 'LiveDbDispLink', schema='pl_diagram', type_='foreignkey')
    op.create_foreign_key('LiveDbDispLink_coordSetId_fkey', 'LiveDbDispLink', 'ModelCoordSet', ['coordSetId'], ['id'], source_schema='pl_diagram', referent_schema='pl_diagram', ondelete='CASCADE')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('LiveDbDispLink_coordSetId_fkey', 'LiveDbDispLink', schema='pl_diagram', type_='foreignkey')
    op.create_foreign_key('LiveDbDispLink_coordSetId_fkey', 'LiveDbDispLink', 'ModelCoordSet', ['coordSetId'], ['id'], source_schema='pl_diagram', referent_schema='pl_diagram')
    op.drop_constraint('GridKeyIndex_coordSetId_fkey', 'GridKeyIndex', schema='pl_diagram', type_='foreignkey')
    op.create_foreign_key('GridKeyIndex_coordSetId_fkey', 'GridKeyIndex', 'ModelCoordSet', ['coordSetId'], ['id'], source_schema='pl_diagram', referent_schema='pl_diagram')
    # ### end Alembic commands ###