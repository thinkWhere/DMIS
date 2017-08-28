"""empty message

Revision ID: a4b508b74727
Revises: 42b49f9fd9eb
Create Date: 2017-08-28 14:52:19.064697

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a4b508b74727'
down_revision = '42b49f9fd9eb'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('dmis_layers', 'layer_title')
    op.drop_column('dmis_layers', 'layer_group')
    op.drop_column('dmis_layers', 'layer_copyright')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('dmis_layers', sa.Column('layer_copyright', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('dmis_layers', sa.Column('layer_group', sa.VARCHAR(), autoincrement=False, nullable=False))
    op.add_column('dmis_layers', sa.Column('layer_title', sa.VARCHAR(), autoincrement=False, nullable=True))
    # ### end Alembic commands ###
