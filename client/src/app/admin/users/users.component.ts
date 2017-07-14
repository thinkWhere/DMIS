import { Component, OnInit } from '@angular/core';

import { UserService } from './user.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  userList: any;
  selectedUser: null;
  errorDeletingUser: boolean = false;

  constructor(
      private userService: UserService
  ) { }

  ngOnInit() {
    this.getLayers();
  }

  getLayers() {
     this.userService.getAllUsers()
            .subscribe(
            data => {
              // Success
              this.userList = data.userList;
            },
            error => {
              // TODO: handle error
            });
  }

  deleteUser(user){
    this.errorDeletingUser = false;
    this.userService.deleteUser(user.username)
        .subscribe(
            data => {
              // Success
              this.userList = this.userList.filter(u => u !== user);
              if (this.selectedUser === user) { this.selectedUser = null; }
            },
            error => {
              // TODO: handle error
              console.log("error");
              this.errorDeletingUser = true;
            });
  }

}
