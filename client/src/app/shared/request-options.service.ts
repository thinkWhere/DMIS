import { Injectable } from '@angular/core';
import { BaseRequestOptions, RequestOptions, RequestOptionsArgs } from '@angular/http';

@Injectable()
export class RequestOptionsService extends BaseRequestOptions {

  constructor() {
    super();
  }

  /**
   * Add cache control headers to ensure that IE & Edge don't use the cache for API calls
   * https://blog.alex-miller.co/angular/2017/05/13/default-headers-in-angular.html
   * If using the newer HttpClient instead of Http, you can use interceptors.
   * TODO: review refactor of moving from Http to HttpClient in whole application so interceptors can be used
   * @param options
   * @returns {RequestOptions}
   */
  merge(options?:RequestOptionsArgs): RequestOptions {
    const newOptions = super.merge(options);
    // Don't override the headers when they are not set. Otherwise an error occurs: Request header field Cache-Control is not allowed by Access-Control-Allow-Headers in preflight response.
    if (options.headers){
      newOptions.headers.append('Cache-Control', 'no-cache');
      newOptions.headers.append('Expires', '-1');
      newOptions.headers.append('Pragma', 'no-cache');
    }
    return newOptions;
  }
}
