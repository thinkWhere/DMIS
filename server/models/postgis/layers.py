from typing import Optional

from flask import current_app
from server import db
from server.models.dtos.layer_dto import DMISLayersDTO, LayerDetailsDTO, LayerUpdateDTO
from server.models.postgis.layer_info import LayerInfo
from server.models.postgis.lookups import MapCategory, LayerType


class Layer(db.Model):
    """ Describes the layer table """
    __tablename__ = "dmis_layers"

    layer_id = db.Column(db.BigInteger, primary_key=True, index=True)
    layer_name = db.Column(db.String, unique=True, index=True)
    layer_title = db.Column(db.String, default="New Layer")
    layer_group = db.Column(db.String, default="OTHER LAYERS", nullable=False)
    map_category = db.Column(db.Integer, default=0, nullable=False)
    layer_source = db.Column(db.String)
    layer_copyright = db.Column(db.String)
    layer_type = db.Column(db.String, default='wms', nullable=False)
    layer_style = db.Column(db.JSON)

    # Mapped Objects
    layer_info = db.relationship(LayerInfo, cascade='all')

    @classmethod
    def create_from_dto(cls, layer_dto: LayerDetailsDTO):
        """ Creates new layer from DTO """
        new_layer = cls()
        new_layer.layer_name = layer_dto.layer_name
        new_layer.layer_title = layer_dto.layer_title
        new_layer.layer_source = layer_dto.layer_source
        new_layer.map_category = MapCategory[layer_dto.map_category].value
        new_layer.layer_group = layer_dto.layer_group
        new_layer.layer_copyright = layer_dto.layer_copyright
        new_layer.layer_type = LayerType[layer_dto.layer_type].value
        new_layer.layer_style = layer_dto.layer_style

        db.session.add(new_layer)
        db.session.commit()

        return new_layer

    @staticmethod
    def get_by_id(layer_id: int):
        """ Return the layer for the specified id, or None if not found """
        layer = Layer.query.get(layer_id)
        return layer

    def get_by_layername(self, layername: str):
        """ Return the layer for the specified layername, or None if not found """
        return Layer.query.filter_by(layer_name=layername).one_or_none()

    def delete(self):
        """ Delete the layer in scope from DB """
        db.session.delete(self)
        db.session.commit()

    @staticmethod
    def get_all_layers() -> Optional[DMISLayersDTO]:
        """ Get all available layers in the DB """
        db_layers = Layer.query.all()

        if len(db_layers) == 0:
            return None

        layers_dto = DMISLayersDTO()

        for layer in db_layers:
            layers_dto.layers.append(layer.as_dto())

        return layers_dto

    def as_dto(self) -> LayerDetailsDTO:
        """ Returns a LayerDetailsDTO object for the layer in scope """
        layer_details = LayerDetailsDTO()
        layer_details.layer_id = self.layer_id
        layer_details.layer_name = self.layer_name
        layer_details.layer_title = self.layer_title
        layer_details.layer_group = self.layer_group
        layer_details.layer_source = self.layer_source
        layer_details.layer_copyright = self.layer_copyright
        layer_details.layer_type = self.layer_type
        layer_details.map_category = MapCategory(self.map_category).name
        layer_details.layer_style = self.layer_style

        for info in self.layer_info:
            layer_details.layer_info.append(info.as_dto())

        return layer_details

    def update(self, layer_update_dto: LayerUpdateDTO):
        """ Update the user details """
        self.layer_title = layer_update_dto.layer_title
        self.layer_copyright = layer_update_dto.layer_copyright
        self.map_category = MapCategory[layer_update_dto.map_category].value
        self.layer_group = layer_update_dto.layer_group
        db.session.commit()
