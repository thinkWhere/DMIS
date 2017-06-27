import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AdminComponent } from './admin.component';
import { UsersComponent } from './users/users.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
          {
            path: '',
            component: AdminComponent,
            children: [
              {
                path: '',
                children: [
                  { path: 'users', component: UsersComponent },
                  { path: '', component: AdminDashboardComponent }
                ]
              }
            ]
          }
      ])
  ],
  declarations: [
      AdminComponent,
      UsersComponent,
      AdminDashboardComponent
  ]
})
export class AdminModule { }
