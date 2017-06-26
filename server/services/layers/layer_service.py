from flask import current_app
from server.models.dtos.layer_dto import LayerDTO, LayerTOCDTO
from server.models.postgis.layers import Layer
from server.models.postgis.utils import NotFound


class LayerService:

    @staticmethod
    def create_layer(layer_dto: LayerDTO):
        """
        Creates a new layer record
        :param layer_dto: DTO containing all layer details
        :return: Layer if created successfully
        """

        new_layer = Layer()
        new_layer.layer_name = layer_dto.layer_name
        new_layer.layer_title = layer_dto.layer_title
        new_layer.layer_description = layer_dto.layer_description
        new_layer.layer_source = layer_dto.layer_source
        new_layer.map_category = layer_dto.map_category
        new_layer.layer_group = layer_dto.layer_group
        new_layer.create()

        return new_layer

    @staticmethod
    def get_layers_for_role(user_role: int) -> LayerTOCDTO:
        """ Returns layers that matches role """
        layers = Layer.get_by_role(user_role)

        if layers is None:
            raise NotFound()

        return layers

    @staticmethod
    def get_layer_list():
        """ Returns details for all layers, used for admin purposes """
        layers = Layer.get_all_layers()

        if layers is None:
            raise NotFound()

        return layers
