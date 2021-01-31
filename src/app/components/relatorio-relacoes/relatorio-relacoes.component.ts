import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { Chart } from 'node_modules/chart.js/dist/Chart.js';
import 'node_modules/chartjs-plugin-labels/src/chartjs-plugin-labels.js';
import 'node_modules/chartjs-plugin-doughnutlabel/dist/chartjs-plugin-doughnutlabel.js';

@Component({
  selector: 'app-relatorio-relacoes',
  templateUrl: './relatorio-relacoes.component.html',
  styleUrls: ['./relatorio-relacoes.component.css']
})
export class RelatorioRelacoesComponent implements OnInit, AfterViewInit {
  @ViewChild('paginatorTabelaRelacoes') paginator: MatPaginator;
  @ViewChild('relacaoTagsGraf',{static:true}) relacaoTagsGraf:ElementRef;
  @ViewChild('filtroTabela',{static:true}) filtroTabela;
  @ViewChild('tagSelector',{static:true}) tagSelector;
  @ViewChild(MatSort) relacoesSort: MatSort;

  @Input() tagsDistintas;
  @Input() legendas;
  @Input() regexTagGlobal;
  @Input() criarCategoriaOutros;

  selectedTag = '';
  
  relacaoTags = {};
  relacaoTagsGrafico = null;
  dataSourceTabelaRelacoes;
  colunasTabelaRelacoes = ["tag", "quantidade"];
  defaultPageSize = 10;
  numeroTagsRelacionadas = '-'

  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  
  constructor() { }

  ngOnInit(){

  }

  ngAfterViewInit(){
    this.atualizarFilteredOptions();
  }

  ngOnChanges(changes){

    if((changes.tagsDistintas && !changes.tagsDistintas.firstChange) ||
       (changes.legendas && !changes.legendas.firstChange)){
      this.selectedTag = '';
      this.relacaoTags = {};
      this.filtroTabela.nativeElement.value = '';
      this.tagSelector.nativeElement.value = '';
      this.dataSourceTabelaRelacoes = undefined;
      this.relacoesSort.active = this.relacoesSort.direction = '';
      this.paginator.pageSize = this.defaultPageSize;
      this.numeroTagsRelacionadas = '-';

      if(this.relacaoTagsGrafico != null){
        this.relacaoTagsGrafico.destroy();
      }

      this.atualizarFilteredOptions();
    }
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return Object.getOwnPropertyNames(this.tagsDistintas).filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceTabelaRelacoes.filter = filterValue.trim().toLowerCase();

    if (this.dataSourceTabelaRelacoes.paginator) {
      this.dataSourceTabelaRelacoes.paginator.firstPage();
    }
  }

  getTotalTags(){
    if(this.dataSourceTabelaRelacoes != undefined){
      return this.dataSourceTabelaRelacoes.filteredData.reduce((acum, valorAtual)=>{
        return Number(valorAtual.quantidade) + acum;
      }, 0);
    }else{
      return '-';
    }
  }

  atualizarFilteredOptions(){
    if(Object.getOwnPropertyNames(this.tagsDistintas).length > 0){
      this.filteredOptions = this.myControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value))
      );
    }
  }

  atualizarObjetosRelacoes(regexTagGlobal){
    let regexSelectedTag = new RegExp(this.selectedTag); 
    let tagsLegenda;
    let novaRelacao = {};
    //let relacoes = this.construirMatrizRelacoes();

    //texto = this.formatarTagsTexto(texto);
    //console.log(texto);
    
    //legendas = texto.split(/(?:[\n\r]|[\n\n]){2,}/); //separando por linhas em branco
    //console.log(legendas);
    
    this.legendas.forEach((legenda) => {
      if(regexSelectedTag.test(legenda)){
        tagsLegenda = legenda.match(regexTagGlobal);

          tagsLegenda = this.filtrarTags(tagsLegenda);

          tagsLegenda.forEach(tag => {
            if(tag != this.selectedTag){
              if(novaRelacao.hasOwnProperty(tag)){
                ++novaRelacao[tag];
              }
              else{
                novaRelacao[tag] = 1;
              }
            }
          });       
      }
    });

    this.relacaoTags[this.selectedTag] = novaRelacao;
  }


  filtrarTags(tagsLegenda){
    if(tagsLegenda == null){
      return [];
    }

    return tagsLegenda.filter(
      (tag) => this.tagsDistintas.hasOwnProperty(tag)
    );
  }

  onSelectedTagChange(valorSelecionado){
    this.selectedTag = valorSelecionado;

    if(this.relacaoTagsGrafico){
      this.relacaoTagsGrafico.destroy();
    }
    
    if(!this.relacaoTags.hasOwnProperty(this.selectedTag)){
      this.atualizarObjetosRelacoes(this.regexTagGlobal);
    }
    
    this.montarDadosGraficoRelacoes();
    this.montarTabelaRelacoes();
  }

  montarTabelaRelacoes(){
    let dados = [];
    let tagsAssociadas = Object.getOwnPropertyNames(this.relacaoTags[this.selectedTag]);
    
    tagsAssociadas.forEach(tag => {
      dados.push({tag: tag, quantidade: this.relacaoTags[this.selectedTag][tag]});
    });

    this.dataSourceTabelaRelacoes = new MatTableDataSource(dados);
    this.dataSourceTabelaRelacoes.paginator = this.paginator;
    this.numeroTagsRelacionadas = dados.length.toString();

    //console.log(this.relacoesSort)
    this.dataSourceTabelaRelacoes.sort = this.relacoesSort;
  }

  montarDadosGraficoRelacoes(){
    let dados = [];
    let labels = [];
    let cores = [];
    let indiceCor;
    let tagsAssociadas;
    let total;
    let totalOutros;
    let colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
		  '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
		  '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
		  '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
		  '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
		  '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
		  '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
		  '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
		  '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
		  '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];

    //console.log(this.selectedTag);
    
    tagsAssociadas = Object.getOwnPropertyNames(this.relacaoTags[this.selectedTag]);

    total = 0;

    tagsAssociadas.forEach(tag => {
      total += this.relacaoTags[this.selectedTag][tag];
    });

    totalOutros = 0;

    tagsAssociadas.forEach(tag => {
      if(!this.criarCategoriaOutros || this.relacaoTags[this.selectedTag][tag]/total >= 0.01){
        labels.push(tag);
        dados.push(this.relacaoTags[this.selectedTag][tag]);
        
        indiceCor = cores.length >= colorArray.length? cores.length%colorArray.length: cores.length;
        cores.push(colorArray[indiceCor]);
      }
      else{
        totalOutros += this.relacaoTags[this.selectedTag][tag];
      }
    });

    if(totalOutros > 0){
      labels.push('Outros');
      dados.push(totalOutros);

      indiceCor = cores.length >= colorArray.length? cores.length%colorArray.length: cores.length;
      cores.push(colorArray[indiceCor]);
    }

    this.plotarRelacoesTags(labels, dados, cores);
  }

  plotarRelacoesTags(labels, dados, cores){

    let ctx = this.relacaoTagsGraf.nativeElement.getContext('2d');

    let hexToRgb = function(hex) {
      let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }

    this.relacaoTagsGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dados,
                borderAlign: 'inner',
                borderWidth:1, 
                backgroundColor: cores
            }]
        },
        options: {
          title: {
            display: true,
            text: 'Tags Relacionadas a ' + this.selectedTag
          },
          plugins: {
            labels: {
              render: 'percentage',
              fontColor: function (data) {
                let rgb = hexToRgb(data.dataset.backgroundColor[data.index]);
                let threshold = 140;
                let luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
                return luminance > threshold ? 'black' : 'white';
              },
              precision: 2
            },
            doughnutlabel:{
              labels:[{
                text:function(data){
                  return data.getDatasetMeta(0).total;
                },
                font: {
                  size: '20',
                  weight: 'bold'
                } 
              },
              {
                text:'Total'
              }]
            }
          }
        }
    });
  }
}
