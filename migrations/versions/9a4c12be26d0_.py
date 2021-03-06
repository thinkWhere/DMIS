"""empty message

Revision ID: 9a4c12be26d0
Revises: abc2e0ccd096
Create Date: 2017-07-19 11:14:49.243644

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '9a4c12be26d0'
down_revision = 'abc2e0ccd096'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('dmis_layers', sa.Column('layer_type', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('dmis_layers', 'layer_type')
    # ### end Alembic commands ###
