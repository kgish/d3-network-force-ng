import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { GraphResolver } from './graph.resolver';

describe('bbbResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) =>
    TestBed.runInInjectionContext(() => GraphResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
