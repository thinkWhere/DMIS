import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule} from '@angular/router/testing';

import { AppComponent } from './app.component';
import { AuthenticationService } from './shared/authentication.service';

describe('AppComponent', () => {
  beforeEach(async(() => {
    
    // Mock for the authenticationService 
    let authenticationServiceStub = {};
    
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [
        AppComponent
      ],
      providers: [{provide: AuthenticationService, useValue: authenticationServiceStub}]
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
