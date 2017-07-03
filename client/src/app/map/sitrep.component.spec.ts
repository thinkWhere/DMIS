import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SitrepComponent } from './sitrep.component';

describe('SitrepComponent', () => {
  let component: SitrepComponent;
  let fixture: ComponentFixture<SitrepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SitrepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SitrepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
