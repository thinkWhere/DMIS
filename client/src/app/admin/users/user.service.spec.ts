import { TestBed, inject } from '@angular/core/testing';
import { HttpModule } from '@angular/http';

import { UserService } from './user.service';
import { AuthenticationService } from './../../shared/authentication.service';

describe('UserService', () => {

  // Mock
  let authenticationServiceStub = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
          UserService,
        {provide: AuthenticationService, useValue: authenticationServiceStub}
      ]
    });
  });

  it('should be created', inject([UserService], (service: UserService) => {
    expect(service).toBeTruthy();
  }));
});

