import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { Chart } from 'node_modules/chart.js/dist/Chart.js';
import 'node_modules/chartjs-plugin-labels/src/chartjs-plugin-labels.js';
import 'node_modules/chartjs-plugin-doughnutlabel/dist/chartjs-plugin-doughnutlabel.js';


@Component({
  selector: 'app-relatorio-geral',
  templateUrl: './relatorio-geral.component.html',
  styleUrls: ['./relatorio-geral.component.css']
})
export class RelatorioGeralComponent implements OnInit {

  @ViewChild('paginatorTabelaDistintas') paginator: MatPaginator;
  @ViewChild('tagsDistintasGraf',{static:true}) tagsDistintasGraf:ElementRef;
  @ViewChild('filtroTabela',{static:true}) filtroTabela;
  @ViewChild(MatSort) sort: MatSort;

  @Input() tagsDistintas;
  @Input() legendas;
  @Input() regexTagGlobal;
  
  tagsDistintasGrafico = null;
  dataSourceTabelaDistintas;
  colunasTabelaDistintas = ["tag", "quantidade"];
  defaultPageSize = 10;

  constructor() { }

  ngOnInit(): void {
    this.gerarRelatorio();
  }

  ngOnChanges(changes){

    if(changes.legendas && !changes.legendas.firstChange){
      this.filtroTabela.nativeElement.value = '';
      this.dataSourceTabelaDistintas = undefined;
      this.sort.active = this.sort.direction = '';
      this.paginator.pageSize = this.defaultPageSize;

      if(this.tagsDistintasGrafico != null){
        this.tagsDistintasGrafico.destroy();
      }

      this.gerarRelatorio();
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceTabelaDistintas.filter = filterValue.trim().toLowerCase();

    if (this.dataSourceTabelaDistintas.paginator) {
      this.dataSourceTabelaDistintas.paginator.firstPage();
    }
  }
  
  getTotalTags(){
    if(this.dataSourceTabelaDistintas != undefined){
      return this.dataSourceTabelaDistintas.filteredData.reduce((acum, valorAtual)=>{
        return Number(valorAtual.quantidade) + acum;
      }, 0);
    }else{
      return '-';
    }
  }

  gerarRelatorio(){
    this.montarTabelaRelacoes();
    this.montarGraficoRelacoes();
  }

  montarTabelaRelacoes(){
    let dados = [];
    let tags = Object.getOwnPropertyNames(this.tagsDistintas);
    
    tags.forEach(tag => {
      dados.push({tag: tag, quantidade: this.tagsDistintas[tag]});
    });

    this.dataSourceTabelaDistintas = new MatTableDataSource(dados);
    this.dataSourceTabelaDistintas.paginator = this.paginator;

    console.log(this.sort)
    this.dataSourceTabelaDistintas.sort = this.sort;
  }

  montarGraficoRelacoes(){
    let dados = [];
    let labels = [];
    let cores = [];
    let indiceCor;
    let tags;
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
    
    tags = Object.getOwnPropertyNames(this.tagsDistintas);

    total = 0;

    tags.forEach(tag => {
      total += this.tagsDistintas[tag];
    });

    totalOutros = 0;

    tags.forEach(tag => {
      if(this.tagsDistintas[tag]/total >= 0.01){
        labels.push(tag);
        dados.push(this.tagsDistintas[tag]);
        
        indiceCor = cores.length >= colorArray.length? cores.length%colorArray.length: cores.length;
        cores.push(colorArray[indiceCor]);
      }
      else{
        totalOutros += this.tagsDistintas[tag];
      }
    });

    if(totalOutros > 0){
      labels.push('Outros');
      dados.push(totalOutros);

      indiceCor = cores.length >= colorArray.length? cores.length%colorArray.length: cores.length;
      cores.push(colorArray[indiceCor]);
    }

    this.plotarTagsDistintas(labels, dados, cores);
  }

  plotarTagsDistintas(labels, dados, cores){

    let ctx = this.tagsDistintasGraf.nativeElement.getContext('2d');

    let hexToRgb = function(hex) {
      let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }

    this.tagsDistintasGrafico = new Chart(ctx, {
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
            text: 'Tags Presentes no Arquivo'
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
