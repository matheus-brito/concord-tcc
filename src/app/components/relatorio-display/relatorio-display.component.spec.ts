import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioDisplayComponent } from './relatorio-display.component';

describe('RelatorioDisplayComponent', () => {
  let component: RelatorioDisplayComponent;
  let fixture: ComponentFixture<RelatorioDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RelatorioDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatorioDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
