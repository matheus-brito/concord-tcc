import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcordFormComponent } from './concord-form.component';

describe('ConcordFormComponent', () => {
  let component: ConcordFormComponent;
  let fixture: ComponentFixture<ConcordFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConcordFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConcordFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
