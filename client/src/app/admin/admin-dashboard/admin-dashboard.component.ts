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
                    var incidentLayers = {
                        'name': 'Incidents and warnings',
                        'value': 0
                    };
                    var assessmentLayers = {
                        'name': 'Assessment and response',
                        'value': 0
                    };
                    for (var i = 0; i < data.layers.length; i++) {
                        if (data.layers[i].mapCategory === 'PREPAREDNESS') {
                            preparednessLayers.value++;
                        }
                        if (data.layers[i].mapCategory === 'INCIDENTS_WARNINGS') {
                            incidentLayers.value++;
                        }
                        if (data.layers[i].mapCategory === 'ASSESSMENT_RESPONSE') {
                            assessmentLayers.value++;
                        }
                    }
                    this.layers.push(preparednessLayers);
                    this.layers.push(incidentLayers);
                    this.layers.push(assessmentLayers);
                     console.log(this.layers);
                },
            error => {
              // TODO: handle error?
            });
  }
}
