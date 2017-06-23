import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { MapComponent } from './map.component';
import { LayerService } from './layer.service';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  // Mocks
  let routerStub = {};
  class layerServiceStub {
    getLayers = jasmine.createSpy('getLayers').and.callFake(
    () => Promise
      .resolve(true)
      .then(() => Object.assign({}, true))
    );
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapComponent ],
      providers: [
        {provide: Router, useValue: routerStub},
        {provide: LayerService, useValue: {}}
      ]
    })
    .overrideComponent(MapComponent, {
      set: {
        providers: [
          {provide: LayerService, useValue: layerServiceStub},
        ]
      }
    })
     .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // TODO: fix test - the layer service is probably not mocked up properly
  //it('should be created', () => {
  //  expect(component).toBeTruthy();
  //});
});
