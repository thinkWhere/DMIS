from server import db
from server.models.dtos.layer_dto import LayerInfoDTO


class LayerInfo(db.Model):
    """ Describes the layer_info table table """
    __tablename__ = "dmis_layer_info"

    layer_id = db.Column(db.Integer, db.ForeignKey('dmis_layers.layer_id'), primary_key=True)
    locale = db.Column(db.String(10), primary_key=True)
    layer_title = db.Column(db.String, default="New Layer")
    layer_group = db.Column(db.String, nullable=False)
    layer_copyright = db.Column(db.String)

    @classmethod
    def create_from_dto(cls, dto: LayerInfoDTO) -> 'LayerInfo':
        """ Creates new LayerInfo if it doesn't already exist """
        new_info = cls()
        new_info.locale = dto.locale
        new_info.update_from_dto(dto)
        return new_info

    def update_from_dto(self, dto: LayerInfoDTO):
        """ Updates existing LayerInfo """
        self.layer_title = dto.layer_title
        self.layer_group = dto.layer_group
        self.layer_copyright = dto.layer_copyright

    def as_dto(self) -> LayerInfoDTO:
        """ Return object as LayerInfoDTO """
        dto = LayerInfoDTO()
        dto.locale = self.locale
        dto.layer_title = self.layer_title
        dto.layer_group = self.layer_group
        dto.layer_copyright = self.layer_copyright

        return dto
