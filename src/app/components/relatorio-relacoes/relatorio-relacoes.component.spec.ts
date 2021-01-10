import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioRelacoesComponent } from './relatorio-relacoes.component';

describe('RelatorioRelacoesComponent', () => {
  let component: RelatorioRelacoesComponent;
  let fixture: ComponentFixture<RelatorioRelacoesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RelatorioRelacoesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatorioRelacoesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
