import { TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule} from '@angular/router/testing';

import { AuthGuardService } from './auth-guard.service';
import { AuthenticationService } from './authentication.service';

describe('AuthGuardService', () => {

  let authenticationServiceStub = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthGuardService,
        {provide: AuthenticationService, useValue: authenticationServiceStub}
      ]
    });
  });

  it('should be created', inject([AuthGuardService], (service: AuthGuardService) => {
    expect(service).toBeTruthy();
  }));
});
