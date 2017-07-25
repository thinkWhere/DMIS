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
  invalidUsernameSupplied: boolean = false;

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
    console.log(user.value);
    this.successAddingUser = false;
    this.errorAddingUser = false;
    this.invalidUsernameSupplied = false;
    // Remove whitespace on both sides of the string
    user.value.username = user.value.username.trim();
    user.value.password = user.value.password.trim();
    // Only submit user when username contains no spaces
    if (this.hasWhiteSpace(user.value.username)){
       this.invalidUsernameSupplied = true;
    }
    else {
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

  /**
   * Check string for whitespace
   * @param string
   * @returns {boolean}
   */
  hasWhiteSpace(string) {
    return string.indexOf(' ') >= 0;
  }
}
