import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderByPipe } from 'angular-pipes/src/array/order-by.pipe';

import { LayerService } from './layer.service';

@Component({
  selector: 'app-layer-list',
  templateUrl: './layer-list.component.html',
  styleUrls: ['./layer-list.component.scss'],
  providers: [ LayerService ]
})
export class LayerListComponent implements OnInit {

  layerList: any = [];
  errorGettingLayerList: any;

  constructor(
      private layerService: LayerService,
      private router: Router
  ) { }

  ngOnInit() {
    this.getLayers();
  }

  /**
   * Gets all the users
   */
  getLayers() {
     this.errorGettingLayerList = false;
     this.layerService.getLayers()
            .subscribe(
            data => {
              // Success
              this.layerList = [];
              // TODO: let the API do this?
              if (data.preparednessLayers) {
                for (var i = 0; i < data.preparednessLayers.length; i++){
                  this.layerList.push(data.preparednessLayers[i]);
                }
              }
              if (data.incidentLayers){
                for (var i = 0; i < data.incidentLayers.length; i++){
                   this.layerList.push(data.incidentLayers[i]);
                }
              }
              if (data.responseLayers){
                for (var i = 0; i < data.responseLayers.length; i++){
                  this.layerList.push(data.responseLayers[i]);
                }
              }
            },
            error => {
              this.errorGettingLayerList = true;
              this.layerList = [];
            });
  };

  onSelect(layer){
      this.router.navigate(['/admin/layer', layer.layerId])
  }
}
