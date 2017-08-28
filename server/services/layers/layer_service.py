from flask import current_app
from server.models.dtos.layer_dto import DMISLayersDTO, LayerDetailsDTO, LayerUpdateDTO
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
    def get_all_layers(locale: str) -> DMISLayersDTO:
        """ Returns a list of layers """
        layers = Layer.get_all_layers(locale)

        if layers is None:
            raise NotFound()

        return layers

    @staticmethod
    def get_layer_dto_by_id(layer_id: int) -> LayerDetailsDTO:
        """ Returns a layer by ID """
        layer = Layer.get_by_id(layer_id)

        if layer is None:
            raise NotFound()

        return layer.as_dto()

    @staticmethod
    def get_layer_by_id(layer_id: int) -> Layer:
        """ Returns a layer by ID """
        layer = Layer.get_by_id(layer_id)

        if layer is None:
            raise NotFound()

        return layer

    @staticmethod
    def update_layer(layer_update_dto: LayerUpdateDTO) -> LayerDetailsDTO:
        """ Updates the user details in DB """
        layer_details = LayerService.get_layer_by_id(layer_update_dto.layer_id)
        updated_layer_dto = layer_details.update(layer_update_dto)
        return updated_layer_dto
