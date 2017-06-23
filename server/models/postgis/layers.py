from flask import current_app
from server import db
from server.models.dtos.layer_dto import LayerSearchQuery, LayerSearchDTO, ListedLayer, LayerTOCDTO, LayerDetailsDTO
from server.models.postgis.lookups import MapCategory
from server.models.postgis.utils import NotFound


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

    def create(self):
        """ Creates and saves the current model to the DB """
        db.session.add(self)
        db.session.commit()

    def save(self):
        db.session.commit()

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

    @staticmethod
    def get_all_layers(query: LayerSearchQuery) -> LayerSearchDTO:
        """ Search and filter all layers """

        # Base query that applies to all searches
        base = db.session.query(Layer.map_category)

        # Add filter to query as required
        if query.map_category:
            base = base.filter(Layer.map_category == MapCategory[query.role.upper()].value)

        results = base.order_by(Layer.map_category)

        dto = LayerSearchDTO()
        for result in results.items:
            listed_layer = ListedLayer()
            listed_layer.layer_name = result.layer_name
            listed_layer.layer_title = result.layer_title
            listed_layer.map_category = MapCategory(result.map_category).name
            listed_layer.layer_group = result.layer_group
            listed_layer.layer_source = result.layer_source

            dto.layers.append(listed_layer)

        return dto

    @staticmethod
    def get_layers_for_toc() -> LayerTOCDTO:
        """ Get all layers """

        # TODO: filter by role
        # Base query that applies to all searches
        all_layers = db.session.query(Layer.layer_name,
                                      Layer.layer_title,
                                      Layer.map_category,
                                      Layer.layer_group,
                                      Layer.layer_description,
                                      Layer.layer_source)\
            .order_by(Layer.map_category, Layer.layer_group)

        layer_toc_dto = LayerTOCDTO()

        if all_layers is None:
            raise NotFound('No layers found')

        for layer in all_layers:
            layer_toc = Layer.get_layer_details(layer)

            if layer.map_category == MapCategory.PREPAREDNESS:
                layer_toc_dto.preparedness_layers.append(layer_toc)
            elif layer.map_category == MapCategory.INCIDENTS_WARNINGS:
                layer_toc_dto.incident_layers.append(layer_toc)
            elif layer.map_category == MapCategory.ASSESSMENT_RESPONSE:
                layer_toc_dto.assessment_layers.append(layer_toc)
            else:
                current_app.logger.error(f'Unknown Map Category for layer {layer.layer_id}')

    @staticmethod
    def get_layer_details(layer) -> LayerDetailsDTO:
        layer_details = LayerDetailsDTO()
        layer_details.layer_name = layer.layer_name
        layer_details.layer_title = layer.layer_title
        layer_details.layer_group = layer.layer_group
        layer_details.layer_source = layer.layer_source
        layer_details.layer_description = layer.layer_description

        return layer_details
