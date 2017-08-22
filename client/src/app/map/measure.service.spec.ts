import { TestBed, inject } from '@angular/core/testing';

import { MeasureService } from './measure.service';
import { MapService } from './map.service';

describe('MeasureService', () => {

  // Mock
  let mapServiceStub = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MeasureService,
        {provide: MapService, useValue: mapServiceStub}
      ]
    });
  });

  it('should be created', inject([MeasureService], (service: MeasureService) => {
    expect(service).toBeTruthy();
  }));
});