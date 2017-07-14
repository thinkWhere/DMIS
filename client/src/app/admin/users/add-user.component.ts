import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { UserService } from './user.service';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {

  successAddingUser: boolean = false;
  errorAddingUser: boolean = false;

  constructor(
      private userService: UserService
  ) { }

  ngOnInit() {
  }

  /**
   * Add a new user
   * @param user
   */
  addUser(user: NgForm){
    this.successAddingUser = false;
    this.errorAddingUser = false;
    this.userService.addUser(user.value)
        .subscribe(
            data => {
              // Success
              this.successAddingUser = true;
            },
            error => {
              this.errorAddingUser = true;
            });
  }
}
