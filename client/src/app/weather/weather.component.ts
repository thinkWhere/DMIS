import { Component, OnInit } from '@angular/core';
import {Location, LocationStrategy, PathLocationStrategy} from '@angular/common';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss'],
  providers: [Location, {provide: LocationStrategy, useClass: PathLocationStrategy}]
})
export class WeatherComponent implements OnInit {

  languageCode: string = 'en';

  constructor(
      private locationStrategy: LocationStrategy
  ) { }

  ngOnInit() {
     // Checks the language to show the weather map in the correct language
        var baseHref = this.locationStrategy.getBaseHref();
        // If base href is not / or English, then set the language code
        if (baseHref !== '/'){
            // Remove leading '/'
            this.languageCode = baseHref.substring(1);
        }
  }
}
