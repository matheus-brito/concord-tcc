import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart } from 'node_modules/chart.js/dist/Chart.js'
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-relatorio-display',
  templateUrl: './relatorio-display.component.html',
  styleUrls: ['./relatorio-display.component.css']
})
export class RelatorioDisplayComponent implements OnInit, AfterViewInit {
  @Input() formData;

  @ViewChild('tagsDistintasGraf',{static:true}) tagsDistintasGraf:ElementRef;

  regexTagGlobal = new RegExp(/<[^/\s<>](?:\s*[^\s<>]*)+>/g); //não considera tags de fechamento
  
  fileText;
  selectedTag = '';
  legendas=[];
  tags=[];
  tagsDistintas={};
  relacaoTags = {};
  relacaoTagsGrafico = null;

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
    
    let dados = [];
    let labels = [];
    let tagsAssociadas;
    
    this.selectedTag = valorSelecionado;

    console.log(this.selectedTag);

    if(this.relacaoTagsGrafico){
      this.relacaoTagsGrafico.destroy();
    }
    
    if(!this.relacaoTags.hasOwnProperty(this.selectedTag)){
      this.atualizarObjetosRelacoes(this.regexTagGlobal);
    }
    
    tagsAssociadas = Object.getOwnPropertyNames(this.relacaoTags[this.selectedTag]);

    tagsAssociadas.forEach(tag => {
      labels.push(tag);
      dados.push(this.relacaoTags[this.selectedTag][tag]);
    });

    this.plotarRelacoesTags(labels, dados);
  }

  plotarRelacoesTags(labels, dados){

    let ctx = this.tagsDistintasGraf.nativeElement.getContext('2d');
    this.relacaoTagsGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tags Associadas',
                data: dados,
                borderWidth: 1
            }]
        },
        options: {
            responsive:true,
            maitainAspectRatio:false,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        stepSize:1
                    }
                }]
            }
        }
    });
  }

}
