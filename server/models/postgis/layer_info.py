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

    def as_dto(self) -> LayerInfoDTO:
        """ Return object as LayerInfoDTO """
        dto = LayerInfoDTO()
        dto.locale = self.locale
        dto.layer_title = self.layer_title
        dto.layer_group = self.layer_group
        dto.layer_copyright = self.layer_copyright

        return dto
