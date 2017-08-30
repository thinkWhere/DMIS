import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import 'rxjs/add/operator/switchMap';

import { LayerService } from './layer.service';

@Component({
  selector: 'app-layer',
  templateUrl: './layer.component.html',
  styleUrls: ['./layer.component.scss'],
  providers: [LayerService]
})
export class LayerComponent implements OnInit {

  layer: any = [];
  editMode: boolean = false;
  categoryOptions: any = [
      {value: 'PREPAREDNESS'},
      {value: 'INCIDENTS_WARNINGS'},
      {value: 'ASSESSMENT_RESPONSE'}
  ];
  selectedCategory: any = {
      value: '',
      name: ''
  };
  errorGettingLayer: boolean = false;
  errorUpdatingLayer: boolean = false;

  constructor(
      private route: ActivatedRoute,
      private layerService: LayerService
  ) { }

  ngOnInit() {
    this.getLayer();
  }

  /**
   * Get the layer's details
   */
  getLayer(){
      this.errorGettingLayer = false;
      this.route.paramMap
      .switchMap((params: ParamMap) =>
        this.layerService.getLayer(params.get('id')))
      .subscribe(
          data => {
            this.layer = data;
            this.selectedCategory = this.getSelectedCategory(this.layer.mapCategory);
          },
          error => {
             this.layer = {};
             this.errorGettingLayer = true;
          });
  }

  /**
   * Edit layer details - by setting the edit mode to true
   */
  edit(){
      this.editMode = true;
  }

  /**
   * Cancel edit layer details
   */
  cancel(){
      this.editMode = false;
      this.getLayer();
  }

  /**
   * Save layer details
   */
  save(layer){
      layer.mapCategory = this.selectedCategory.value;
      this.editMode = false;
      this.errorUpdatingLayer = false;
      console.log(layer)
      this.layerService.updateLayer(layer)
      .subscribe(
          data => {
            this.layer = data;
            this.selectedCategory = this.getSelectedCategory(this.layer.mapCategory);
          },
          error => {
             this.layer = {};
             this.errorUpdatingLayer = true;
          });
  }

  /**
   * Returns the selected category
   * @param categoryValue
   * @returns {null}
   */
  getSelectedCategory(categoryValue){
      let selectedCategory = null;
      for (var i = 0; i < this.categoryOptions.length; i++){
          if (categoryValue === this.categoryOptions[i].value){
              selectedCategory = this.categoryOptions[i];
              return selectedCategory;
          }
      }
      return selectedCategory;
  }
}
