from typing import Optional

from flask import current_app
from server import db
from server.models.dtos.layer_dto import DMISLayersDTO, LayerDetailsDTO, LayerUpdateDTO
from server.models.postgis.lookups import MapCategory, LayerType


class LayerInfo(db.Model):
    """ Describes the layer table """
    __tablename__ = "dmis_layer_info"

    layer_id = db.Column(db.Integer, db.ForeignKey('dmis_layers.layer_id'), primary_key=True)
    locale = db.Column(db.String(10), primary_key=True)
    layer_title = db.Column(db.String, default="New Layer")
    layer_group = db.Column(db.String, nullable=False)
    layer_copyright = db.Column(db.String)

