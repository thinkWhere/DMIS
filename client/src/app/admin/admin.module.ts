import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { UserService } from './users/user.service';

import { AdminComponent } from './admin.component';
import { UsersComponent } from './users/users.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AddUserComponent } from './users/add-user.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
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
                  { path: 'user/add', component: AddUserComponent }
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
      AddUserComponent
  ],
  providers: [UserService],
})
export class AdminModule { }
