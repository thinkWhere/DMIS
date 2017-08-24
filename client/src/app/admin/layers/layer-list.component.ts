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
              this.layerList = data.layers;
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
