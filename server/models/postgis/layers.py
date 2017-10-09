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
    map_category = db.Column(db.Integer, default=0, nullable=False)
    layer_source = db.Column(db.String)
    layer_type = db.Column(db.String, default='wms', nullable=False)
    layer_style = db.Column(db.JSON)
    layer_geometry_type = db.Column(db.String)

    # Mapped Objects
    # Use dynamic relationship to enable filtering of related layer_info rows
    layer_info = db.relationship(LayerInfo, lazy='dynamic', cascade='all')

    @classmethod
    def create_from_dto(cls, layer_dto: LayerDetailsDTO):
        """ Creates new layer from DTO """
        new_layer = cls()
        new_layer.layer_name = layer_dto.layer_name
        new_layer.layer_source = layer_dto.layer_source
        new_layer.map_category = MapCategory[layer_dto.map_category].value
        new_layer.layer_type = LayerType[layer_dto.layer_type].value
        new_layer.layer_style = layer_dto.layer_style
        new_layer.layer_geometry_type = layer_dto.layer_geometry_type

        for info in layer_dto.layer_info_locales:
            new_info = LayerInfo.create_from_dto(info)
            new_layer.layer_info.append(new_info)

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
    def get_all_layers(locale: str) -> Optional[DMISLayersDTO]:
        """ Get all available layers in the DB """
        db_layers = Layer.query.all()

        if len(db_layers) == 0:
            return None

        layers_dto = DMISLayersDTO()

        for layer in db_layers:
            layers_dto.layers.append(layer.as_dto(locale))

        return layers_dto

    def as_dto(self, locale: str = None) -> LayerDetailsDTO:
        """ Returns a LayerDetailsDTO object for the layer in scope """
        layer_details = LayerDetailsDTO()
        layer_details.layer_id = self.layer_id
        layer_details.layer_name = self.layer_name
        layer_details.layer_source = self.layer_source
        layer_details.layer_type = self.layer_type
        layer_details.map_category = MapCategory(self.map_category).name
        layer_details.layer_style = self.layer_style
        layer_details.layer_geometry_type = self.layer_geometry_type

        if locale:
            # If client is filtering by locale only return the layerinfo for the locale they have asked for
            locale_info = self.layer_info.filter_by(locale=locale).one_or_none()
            # Return empty layerInfo if the specified locale doesn't exist, rather than error
            layer_details.layer_info = LayerInfo() if locale_info is None else locale_info.as_dto()
            return layer_details

        # No layer filter so return locale info for all layers.
        for info in self.layer_info:
            layer_details.layer_info_locales.append(info.as_dto())

        return layer_details

    def update(self, layer_update_dto: LayerUpdateDTO) -> LayerDetailsDTO:
        """ Update the layer details """
        self.map_category = MapCategory[layer_update_dto.map_category].value

        # Set layer_info for all supplied locales
        for info in layer_update_dto.layer_info_locales:
            locale_info = self.layer_info.filter_by(locale=info.locale).one_or_none()

            if locale_info is None:
                new_info = LayerInfo.create_from_dto(info)
                self.layer_info.append(new_info)
            else:
                locale_info.update_from_dto(info)

        db.session.commit()

        return self.as_dto()
