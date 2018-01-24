import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgArrayPipesModule } from 'angular-pipes';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { UserService } from './users/user.service';

import { AdminComponent } from './admin.component';
import { UsersComponent } from './users/users.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AddUserComponent } from './users/add-user.component';
import { LayerListComponent } from './layers/layer-list.component';
import { LayerComponent } from './layers/layer.component';

@NgModule({
  imports: [
    NgArrayPipesModule,
    CommonModule,
    FormsModule,
    NgxChartsModule,
    RouterModule.forChild([
          {
            path: '',
            component: AdminComponent,
            children: [
              {
                path: '',
                children: [
                  { path: '', component: AdminDashboardComponent },
                  { path: 'users', component: UsersComponent },
                  { path: 'user/add', component: AddUserComponent },
                  { path: 'layers', component: LayerListComponent },
                  { path: 'layer/:id', component: LayerComponent }
                ]
              }
            ]
          }
      ])
  ],
  declarations: [
      AdminComponent,
      UsersComponent,
      AdminDashboardComponent,
      AddUserComponent,
      LayerListComponent,
      LayerComponent
  ],
  providers: [UserService],
})
export class AdminModule { }
