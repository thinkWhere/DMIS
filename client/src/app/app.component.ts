import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {Location, LocationStrategy, PathLocationStrategy} from '@angular/common';

import { AuthenticationService } from './shared/authentication.service';
import { User } from './user/user';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    providers: [Location, {provide: LocationStrategy, useClass: PathLocationStrategy}]
})
export class AppComponent {

    user: User;
    subscription: Subscription;
    route: string;
    languageCode: string = 'en';

    constructor(
        private authenticationService:AuthenticationService,
        private router:Router,
        private location: Location,
        private locationStrategy: LocationStrategy
    ) {}

    ngOnInit() {
        // Checks which language toggle to show
        var baseHref = this.locationStrategy.getBaseHref();
        // If base href is not / or English, then set the language code
        if (baseHref !== '/'){
            // Remove leading '/'
            this.languageCode = baseHref.substring(1);
        }
        // Checks the route for displaying the categories in the header
        this.route = this.router.url;
        this.router.events.subscribe((event) => {
            this.route = this.router.url;
        });

        // Checks if the user is logged in
        this.user = this.authenticationService.checkLoginStatus();
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
    
    /**
     * Switch language
     * @param languageCode
     */
    switchLanguage(languageCode) {
        // Get host
        var host = window.location.host;
        // Get the base href - language specific
        var code = ''; // default to English
        // Get remaining URL
        var location = this.location.path();
        // If the language code is not English - use the code in the URL
        if (languageCode !== 'en') {
            code = '/' + languageCode;
        }
        window.open('http://' + host + code + location, '_self');
    }
}