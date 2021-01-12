import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArquivoOriginalComponent } from './arquivo-original.component';

describe('ArquivoOriginalComponent', () => {
  let component: ArquivoOriginalComponent;
  let fixture: ComponentFixture<ArquivoOriginalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArquivoOriginalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArquivoOriginalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
