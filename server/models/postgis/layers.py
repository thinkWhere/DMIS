from typing import Optional

from flask import current_app
from server import db
from server.models.dtos.layer_dto import DMISLayersDTO, LayerDetailsDTO
from server.models.postgis.lookups import MapCategory


class Layer(db.Model):
    """ Describes the layer table """
    __tablename__ = "dmis_layers"

    layer_id = db.Column(db.BigInteger, primary_key=True, index=True)
    layer_name = db.Column(db.String, unique=True, index=True)
    layer_title = db.Column(db.String, default="New Layer")
    layer_description = db.Column(db.String, default="", nullable=False)
    layer_group = db.Column(db.String, default="OTHER LAYERS", nullable=False)
    map_category = db.Column(db.Integer, default=0, nullable=False)
    layer_source = db.Column(db.String)

    @classmethod
    def create_from_dto(cls, layer_dto: LayerDetailsDTO):
        """ Creates new layer from DTO """
        new_layer = cls()
        new_layer.layer_name = layer_dto.layer_name
        new_layer.layer_title = layer_dto.layer_title
        new_layer.layer_description = layer_dto.layer_description
        new_layer.layer_source = layer_dto.layer_source
        new_layer.map_category = MapCategory[layer_dto.map_category].value
        new_layer.layer_group = layer_dto.layer_group

        db.session.add(new_layer)
        db.session.commit()

        return new_layer

    def get_by_id(self, layer_id: int):
        """ Return the layer for the specified id, or None if not found """
        return Layer.query.get(layer_id).one_or_none()

    def get_by_layername(self, layername: str):
        """ Return the layer for the specified layername, or None if not found """
        return Layer.query.filter_by(layer_name=layername).one_or_none()

    def delete(self):
        """ Delete the layer in scope from DB """
        db.session.delete(self)
        db.session.commit()

    # @staticmethod
    # def get_all_layers() -> LayerSearchDTO:
    #     """ Return all layers as simple list for admin page """
    #
    #     # Base query that applies to all searches
    #     results = Layer.query.order_by(Layer.map_category, Layer.layer_group, Layer.layer_name).all()
    #
    #     if len(results) == 0:
    #         raise NotFound
    #
    #     dto = LayerSearchDTO()
    #     for result in results:
    #         listed_layer = LayerDTO()
    #         listed_layer.layer_name = result.layer_name
    #         listed_layer.layer_title = result.layer_title
    #         listed_layer.map_category = MapCategory(result.map_category).name
    #         listed_layer.layer_group = result.layer_group
    #         listed_layer.layer_source = result.layer_source
    #
    #         dto.layers.append(listed_layer)
    #
    #     return dto

    @staticmethod
    def get_layers(map_category: MapCategory) -> Optional[DMISLayersDTO]:
        """
        Get all layers grouped by map category, with optional filter by map category
        UNKNOWN category returns all categories
        """

        # TODO: filter by role
        # Base query that applies to all searches
        layer_query = db.session.query(Layer)

        if map_category != MapCategory.UNKNOWN:
            layers = layer_query.filter(Layer.map_category == map_category.value).all()
        else:
            layers = layer_query.order_by(Layer.map_category, Layer.layer_group).all()

        if len(layers) == 0:
            return None

        layers_dto = DMISLayersDTO()

        for layer in layers:
            layer_toc = Layer.get_layer_details(layer)

            if layer.map_category == MapCategory.PREPAREDNESS.value:
                layers_dto.preparedness_layers.append(layer_toc)
            elif layer.map_category == MapCategory.INCIDENTS_WARNINGS.value:
                layers_dto.incident_layers.append(layer_toc)
            elif layer.map_category == MapCategory.ASSESSMENT_RESPONSE.value:
                layers_dto.assessment_layers.append(layer_toc)
            else:
                current_app.logger.error(f'Unknown Map Category for layer {layer.layer_id}')

        return layers_dto

    @staticmethod
    def get_layer_details(layer) -> LayerDetailsDTO:
        layer_details = LayerDetailsDTO()
        layer_details.layer_name = layer.layer_name
        layer_details.layer_title = layer.layer_title
        layer_details.layer_group = layer.layer_group
        layer_details.layer_source = layer.layer_source
        layer_details.layer_description = layer.layer_description

        return layer_details
