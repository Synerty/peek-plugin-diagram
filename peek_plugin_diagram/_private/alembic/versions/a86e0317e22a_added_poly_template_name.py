"""Added Poly template name

Peek Plugin Database Migration Script

Revision ID: a86e0317e22a
Revises: ec97d31aebb0
Create Date: 2019-09-29 22:24:23.878249

"""

# revision identifiers, used by Alembic.
revision = 'a86e0317e22a'
down_revision = 'ec97d31aebb0'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
import geoalchemy2


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('DispPolyline', sa.Column('targetEdgeTemplateId', sa.Integer(), nullable=True), schema='pl_diagram')
    op.add_column('DispPolyline', sa.Column('targetEdgeTemplateName', sa.String(), nullable=True), schema='pl_diagram')
    op.create_index('idx_DispPolyline_targetEdgeTemplateId', 'DispPolyline', ['targetEdgeTemplateId'], unique=False, schema='pl_diagram')
    op.create_foreign_key("DispPolyline_targetEdgeTemplateId_fkey", 'DispPolyline', 'DispEdgeTemplate', ['targetEdgeTemplateId'], ['id'], source_schema='pl_diagram', referent_schema='pl_diagram', ondelete='SET NULL')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint("DispPolyline_targetEdgeTemplateId_fkey", 'DispPolyline', schema='pl_diagram', type_='foreignkey')
    op.drop_index('idx_DispPolyline_targetEdgeTemplateId', table_name='DispPolyline', schema='pl_diagram')
    op.drop_column('DispPolyline', 'targetEdgeTemplateName', schema='pl_diagram')
    op.drop_column('DispPolyline', 'targetEdgeTemplateId', schema='pl_diagram')
    # ### end Alembic commands ###