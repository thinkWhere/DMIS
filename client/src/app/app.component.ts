import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  route = '';

  constructor(
      private router: Router
  ){}

  ngOnInit() {
    this.route = this.router.url;
    this.router.events.subscribe((event) => {
      this.route = this.router.url;
    });
  }
}
