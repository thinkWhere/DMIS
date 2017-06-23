import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription}   from 'rxjs/Subscription';

import {AuthenticationService} from './shared/authentication.service';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    // TODO: create user service
    user:any;
    subscription:Subscription;
    route:string;

    constructor(
        private authenticationService:AuthenticationService,
        private router:Router
    ) {}

    ngOnInit() {
        // Checks the route for displaying the categories in the header
        this.route = this.router.url;
        this.router.events.subscribe((event) => {
            this.route = this.router.url;
        });

        // Checks if the user is logged in
        this.user = JSON.parse(localStorage.getItem('currentUser'));
        this.subscription = this.authenticationService.usernameChanged$.subscribe(
            value => {
                this.user = JSON.parse(localStorage.getItem('currentUser'));
            });
    }

    /**
     * Log the user out
     */
    logout() {
        this.authenticationService.logout();
        this.user = JSON.parse(localStorage.getItem('currentUser'));
        this.router.navigateByUrl('/');
    }
}

