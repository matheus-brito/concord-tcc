import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart } from 'node_modules/chart.js/dist/Chart.js'
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-relatorio-display',
  templateUrl: './relatorio-display.component.html',
  styleUrls: ['./relatorio-display.component.css']
})
export class RelatorioDisplayComponent implements OnInit, AfterViewInit {
  @Input() formData;

  @ViewChild('paginatorTabelaRelacoes') paginator: MatPaginator;
  @ViewChild('tagsDistintasGraf',{static:true}) tagsDistintasGraf:ElementRef;
  @ViewChild(MatSort) relacoesSort: MatSort;

  regexTagGlobal = new RegExp(/<[^/\s<>](?:\s*[^\s<>]*)+>/g); //não considera tags de fechamento
  
  fileText;
  selectedTag = '';
  legendas=[];
  tags=[];
  tagsDistintas={};
  
  relacaoTags = {};
  relacaoTagsGrafico = null;
  dataSourceTabelaRelacoes;
  colunasTabelaRelacoes = ["tag", "quantidade"];

  myControl = new FormControl();
  filteredOptions: Observable<string[]>;
  
  constructor() { }

  ngOnInit(){

  }

  ngAfterViewInit(){
    this.processarTexto();
  }

  ngOnChanges(changes){
    if(changes.formData && !changes.formData.firstChange){
      this.selectedTag = '';
      this.legendas=[];
      this.tags=[];
      this.tagsDistintas={};
      this.relacaoTags = {};

      if(this.relacaoTagsGrafico != null){
        this.relacaoTagsGrafico.destroy();
      }
      
      this.processarTexto();
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

  processarTexto(){
    if(this.formData.arquivoURL){
      let reader = new FileReader();
      let readerTesteISO = new FileReader();
      
      reader.onload = () => {
        this.fileText = reader.result;

        this.legendas = this.fileText.split(/\n[ \t\f\v]*(?:\r[ \t\f\v]*|\n[ \t\f\v]*)+/); //separando por linhas em branco
        this.tags = this.fileText.match(this.regexTagGlobal);
        
        if(this.tags.length > 0){
          this.tags.sort();
          this.tagsDistintas = this.obterTagsDistintas();

          this.filteredOptions = this.myControl.valueChanges.pipe(
            startWith(''),
            map(value => this._filter(value))
          );
        }
      }

      readerTesteISO.onload = ()=>{
        let isISO:boolean;
        let textoLido = readerTesteISO.result as string;
        let regexISO = new RegExp(/�/);
        isISO = regexISO.test(textoLido);

        if(isISO){
          reader.readAsText(this.formData.arquivoURL, "ISO-8859-1");
        }
        else{
          reader.readAsText(this.formData.arquivoURL);
        }
      }
      
      readerTesteISO.readAsText(this.formData.arquivoURL);
    }
  }

  obterTagsDistintas(){
    let tagsAux = {};
    let tagAtual = this.tags[0];
    let count = 1;

    for(let i = 1; i < this.tags.length; ++i){
      if(tagAtual == this.tags[i]){
        ++count;
      }
      else{
        tagsAux[tagAtual] = count;
        tagAtual = this.tags[i];
        count = 1;
      }
    }

    //adicionar última tag (ou primeira caso length == 1)
    tagsAux[tagAtual] = count;
    
    return tagsAux;
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

    console.log(this.relacoesSort)
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

    console.log(this.selectedTag);
    
    tagsAssociadas = Object.getOwnPropertyNames(this.relacaoTags[this.selectedTag]);

    total = 0;

    tagsAssociadas.forEach(tag => {
      total += this.relacaoTags[this.selectedTag][tag];
    });

    totalOutros = 0;

    tagsAssociadas.forEach(tag => {
      if(this.relacaoTags[this.selectedTag][tag]/total >= 0.03){
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

    let ctx = this.tagsDistintasGraf.nativeElement.getContext('2d');
    this.relacaoTagsGrafico = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dados,
                borderAlign: 'inner',
                borderWidth:1, 
                backgroundColor: cores
            }]
        }
    });
  }

}
