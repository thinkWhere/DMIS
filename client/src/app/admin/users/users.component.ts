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
  showDeleteConfirmModal: boolean = false;
  userToDelete: string = '';

  editMode: boolean = false;
  editUsername: string = '';

  constructor(
      private userService: UserService
  ) { }

  ngOnInit() {
    this.getUsers();
  }

  /**
   * Gets all the users
   */
  getUsers() {
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

  /**
   * Set the delete confirm modal to visible/invisible
   * @param boolean visible/invisible
   * @param string username
   */
  showDeleteConfirm(boolean, user){
      this.showDeleteConfirmModal = boolean;
      this.userToDelete = user;
  }

  /**
   * Delete a user
   * @param user
   */
  deleteUser(user){
    this.errorDeletingUser = false;
    this.userService.deleteUser(user.username)
        .subscribe(
            data => {
              // Success
              this.userList = this.userList.filter(u => u !== user);
              if (this.selectedUser === user) { this.selectedUser = null; }
              this.showDeleteConfirm(true, null);
            },
            error => {
              this.errorDeletingUser = true;
            });
  }

  /**
   * Edit user
   * @param user
   */
  editUser(username){
      this.editMode = true;
      this.editUsername = username;
  }

   /**
    * Save edits
    * @param username
    * @param role
   */
  saveEdits(username, role){
      this.editMode = false;
      this.editUsername = '';

      var user = {
          username: username,
          role: role
      };
      this.userService.updateUserRole(user)
        .subscribe(
            data => {
              // Success
            },
            error => {
              // TODO: handle error?
            });
  }

}
