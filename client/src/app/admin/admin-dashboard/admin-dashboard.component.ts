import {Component, OnInit} from '@angular/core';

import { UserService } from './../users/user.service';
import { LayerService } from './../layers/layer.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  providers: [LayerService, UserService]
})
export class AdminDashboardComponent implements OnInit {

  userList: any;

  // NGX-Charts variables
  users: any = [];
  layers: any = [];
  colorScheme: string = 'picnic';
  cardColor: string = '#232837';

  constructor(
      private userService: UserService,
      private layerService: LayerService
  ) { }

  ngOnInit() {
    // Get users and prepare data in a format for NGX-Charts
    this.userService.getAllUsers()
            .subscribe(
            data => {
              // Success
              this.users =  [];
              var numberOfAdmins = 0;
              var numberOfUsers = 0;
              for (var i = 0; i < data.userList.length; i++){
                if (data.userList[i].role === 'ADMIN'){
                  numberOfAdmins++;
                }
                if (data.userList[i].role === 'USER'){
                  numberOfUsers++;
                }
              };
              var totalUsers = {
                'name': 'TOTAL',
                'value': data.userList.length
              };
              this.users.push(totalUsers);
              var admins = {
                'name': 'ADMINS',
                'value': numberOfAdmins
              };
              this.users.push(admins);
              var users = {
                'name': 'USERS',
                'value': numberOfUsers
              };
              this.users.push(users);
            },
            error => {
              // TODO: handle error?
            });

    // Get layers and prepare data in a format for NGX-Charts
    this.layerService.getLayers()
            .subscribe(
            data => {
              // Success
              this.layers = [];
              var preparednessLayers = {
                'name': 'Preparedness',
                'value': 0
              };
              if (data.preparednessLayers) {
                preparednessLayers.value = data.preparednessLayers.length;
              }
              this.layers.push(preparednessLayers);
              var incidentLayers = {
                'name': 'Incidents and warnings',
                'value': 0
              };
              if (data.incidentLayers){
                incidentLayers.value = data.incidentLayers.length;
              }
              this.layers.push(incidentLayers);
              var assessmentLayers = {
                'name': 'Assessment and response',
                'value': 0
              };
              if (data.assessmentLayers){
                assessmentLayers.value = data.assessmentLayers.length;
              }
              this.layers.push(assessmentLayers);
            },
            error => {
              // TODO: handle error?
            });
  }
}
