from flask import current_app
from server.models.dtos.layer_dto import DMISLayersDTO, LayerDetailsDTO
from server.models.postgis.layers import Layer
from server.models.postgis.lookups import MapCategory
from server.models.postgis.utils import NotFound


class LayerServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling projects """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class LayerService:

    @staticmethod
    def create_layer(layer_dto: LayerDetailsDTO) -> Layer:
        """
        Creates a new layer record
        :param layer_dto: DTO containing all layer details
        :return: Layer if created successfully
        """
        new_layer = Layer.create_from_dto(layer_dto)
        return new_layer

    @staticmethod
    def get_layers_by_category(map_category_str: str = 'UNKNOWN') -> DMISLayersDTO:
        """
        Returns layers that match category, all layers returned if UNKNOWN supplied
        :raises: LayerServiceError, NotFound
        """
        try:
            map_category = MapCategory[map_category_str.upper()]
        except KeyError:
            raise LayerServiceError(f'Unknown map category: {map_category_str}')

        layers = Layer.get_layers(map_category)

        if layers is None:
            raise NotFound()

        return layers

