import { Component, Input, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-lines-display',
  templateUrl: './lines-display.component.html',
  styleUrls: ['./lines-display.component.css']
})
export class LinesDisplayComponent implements OnInit{
  
  @ViewChild(MatPaginator) paginator: MatPaginator;

  @Output() onKeywordClick: EventEmitter<any> = new EventEmitter();

  @Input() formData;
  videoTime = 0;
  lines = []
  colunasTabela: string[] = ['contexto_esquerda', 'palavra_chave', 'contexto_direita'];
  linhasTabela;// = new MatTableDataSource<PeriodicElement>([{position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'}]);
  fileText;
  palavras = [];
  caractereLinhasEmBranco = '\u26F8';

  constructor() {}

  ngOnInit(){
    this.processarDadosFormulario();
  }

  ngOnChanges(changes){
    if(changes.formData && !changes.formData.firstChange){
      this.processarDadosFormulario();
    }
  }

  onPalavraChaveClick(tempoLegenda){
    let tempoInicio = this.buscarTempoInicio(tempoLegenda);
    console.log(tempoInicio)
    if(tempoInicio != ''){
      this.onKeywordClick.emit(this.converterParaSegundos(tempoInicio));
    }
  }

  converterParaSegundos(tempo){
    let tempoAux = tempo.replace(/,/, '\:').split(/\:/);
    let segundos;
    segundos = Number(tempoAux[0])*(60**2) + Number(tempoAux[1])*60 + 
               Number(tempoAux[2]) + Number(tempoAux[3]/1000);
    console.log(segundos)
    return segundos;
  }

  buscarTempoInicio(tempoLegenda:string){
    let regex = new RegExp(/(?<tempoInicio>\d{2}\:\d{2}\:\d{2},\d{3})\s*-->/);
    let resultado;
    resultado = tempoLegenda.match(regex)
    if(resultado)
      return resultado.groups.tempoInicio;
    else
      return '';
  }

  processarDadosFormulario(){
    if(this.formData.arquivoURL){
      let reader = new FileReader();
      let readerTesteISO = new FileReader();
      
      reader.onload = () => {
        this.fileText = reader.result;
        let regexMarcacaoTempoEtiquetado = new RegExp(/^(\d{2})\:\d{2}\:\d{2},\d{3}\s*-->\s*\d{2}\:\d{2}(\:\d{2},\d{3})$/);
        let regexMarcacaoTempoEtiquetadoGlobal = new RegExp(/(?<=\u26F8\s*(?:<[^<>]+>\s*)+)(\d{2})\:\d{2}\:\d{2},\d{3}\s*-->\s*\d{2}\:\d{2}(\:\d{2},\d{3})/g);
        let regexMarcacaoTempo = new RegExp(/([1-9])\d*\s+\d{2}\:\d{2}\:\d{2},\d{3}\s*-->\s*\d{2}\:\d{2}(\:\d{2},\d{3})/);
        let regexMarcacaoTempoGlobal = new RegExp(/([1-9])\d*\s+\d{2}\:\d{2}\:\d{2},\d{3}\s*-->\s*\d{2}\:\d{2}(\:\d{2},\d{3})/g);
        let regexTag = new RegExp(/^<(?:[^\s<>]+\s*)+>$/);
        let regexStringVazia = new RegExp(/^$/);
        let textoAux = this.marcarLinhasEmBranco(this.fileText);
        let palavrasAux = this.isolarMarcacoesDeTempo(textoAux, regexMarcacaoTempoGlobal,regexMarcacaoTempoEtiquetadoGlobal);
        this.palavras = [];
        console.log(textoAux)
        palavrasAux.forEach((texto, indice)=>{
            if(regexMarcacaoTempo.test(texto) || regexMarcacaoTempoEtiquetado.test(texto)){
              this.palavras.push(texto);

              if(!this.formData.ignorarTempo)
                this.palavras.push(...this.separarPalavras(texto));
            }
            else{
              this.palavras.push(...this.separarPalavras(texto));
            }
        });
        this.palavras = this.palavras.filter((valor)=>!(regexStringVazia.test(valor)));
        //console.log(this.palavras)
        this.lines = this.concordanciador(this.palavras,this.separarPalavras(this.formData.token), this.formData.tokensEsquerda,
                                          this.formData.tokensDireita, this.formData.caseSensitive,  this.formData.ignorarTags, 
                                          regexMarcacaoTempo, regexMarcacaoTempoEtiquetado, regexTag);
        this.linhasTabela = new MatTableDataSource<Contexto>(this.lines);
        this.linhasTabela.paginator = this.paginator;
        console.log(this.lines);
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

  concordanciador(listaPalavras,termoBuscado:string[], esquerda:number, 
                  direita:number, caseSensitive:boolean, igonorarTags:boolean,
                  regexMarcacaoTempo, regexMarcacaoTempoEtiquetado, regexTag){
    let linhasConcord=[];
    
    let indexBusca;
    let tempoLegenda;
    let termoEncontrado;
    let contadorPalavras;
    let regexTeste;
    let regexIgnoreCaseFlag='';
    let textoEsquerda:string, textoDireita:string;
    textoEsquerda = textoDireita = '';

    if(!caseSensitive)
      regexIgnoreCaseFlag = 'i';
    
    listaPalavras.forEach((palavra,indice) => {
      if(termoBuscado.length == 1)
        regexTeste = new RegExp('^[!\\.,;\\:\\?\'\"]*' + termoBuscado[0] + '[!\\.,;\\:\\?\"]?(\'\\w*)?$', regexIgnoreCaseFlag);
      else
        regexTeste = new RegExp('^[!\\.,;\\:\\?\'\"]*' + termoBuscado[0] + '$', regexIgnoreCaseFlag);  
      
      if(regexTeste.test(palavra)){
        termoEncontrado = this.buscarTermo(listaPalavras, indice, termoBuscado, regexIgnoreCaseFlag);
        
        if(termoEncontrado != null){
          contadorPalavras = 0;

          for(indexBusca = indice-1; indexBusca >= 0 && contadorPalavras < esquerda; --indexBusca){
            if(!(regexMarcacaoTempo.test(listaPalavras[indexBusca]) ||
               regexMarcacaoTempoEtiquetado.test(listaPalavras[indexBusca])) &&
               listaPalavras[indexBusca] != this.caractereLinhasEmBranco){
              if(!regexTag.test(listaPalavras[indexBusca]) || !igonorarTags){
                textoEsquerda = listaPalavras[indexBusca] + ' ' + textoEsquerda;
                ++contadorPalavras;
              }
            }
          }

          contadorPalavras = 0;
          for(let i = indice + termoBuscado.length; i < listaPalavras.length && contadorPalavras < direita ;++i){
            if(!regexMarcacaoTempo.test(listaPalavras[i]) &&
               !regexMarcacaoTempoEtiquetado.test(listaPalavras[i]) &&
               listaPalavras[i] != this.caractereLinhasEmBranco &&
              (!regexTag.test(listaPalavras[i]) || !igonorarTags)){
              textoDireita += listaPalavras[i] + ' ';
              ++contadorPalavras;
            }
          }

          tempoLegenda = this.encontrarTempoLegenda(listaPalavras, indice, regexMarcacaoTempo, regexMarcacaoTempoEtiquetado);
          linhasConcord.push({contexto_esquerda: textoEsquerda.trim(), palavra_chave: {keyword:termoEncontrado, time:tempoLegenda}, contexto_direita: textoDireita.trim()});
          textoEsquerda = textoDireita = '';
        }
      }
    })
    return linhasConcord;
  }

  buscarTermo(listaPalavras, indice, termoBuscado:string[], regexIgnoreCaseFlag){
    let termoEncontrado = null;
    let palavra = listaPalavras[indice];

    if(termoBuscado.length == 1){
      termoEncontrado = palavra;
    }
    else if(indice + termoBuscado.length <= listaPalavras.length){
      termoEncontrado = palavra;
      for(let i = 1; i < termoBuscado.length-1; ++i){
        if(new RegExp('^'+termoBuscado[i], regexIgnoreCaseFlag).test(listaPalavras[indice+i])){
          termoEncontrado += ' ' + listaPalavras[indice + i];
        }
        else{
          termoEncontrado = null;
          break;
        }
      }
      if(termoEncontrado != null){
        if(new RegExp('^'+termoBuscado[termoBuscado.length-1]+'[!\\.,;\\:\\?\"]?').test(listaPalavras[indice + termoBuscado.length-1])){
          termoEncontrado += ' ' + listaPalavras[indice + termoBuscado.length-1];
        }
        else{
          termoEncontrado = null;
        }
      }
    }

    return termoEncontrado;
  }

  encontrarTempoLegenda(listaPalavras, indice, regexMarcacaoTempo, regexMarcacaoTempoEtiquetado){
    for(let i = indice; indice >=0 && listaPalavras[i] != this.caractereLinhasEmBranco; --i){
      if(regexMarcacaoTempo.test(listaPalavras[i]) || regexMarcacaoTempoEtiquetado.test(listaPalavras[i])){
        return listaPalavras[i];
      }
    }

    for(let i = indice; indice < listaPalavras.length && listaPalavras[i] != this.caractereLinhasEmBranco; ++i){
      if(regexMarcacaoTempo.test(listaPalavras[i]) || regexMarcacaoTempoEtiquetado.test(listaPalavras[i])){
        return listaPalavras[i];
      }
    }

    return '';
  }

 /*  tokenizar(texto:string){ 
    let palavra = ''
    for (let caractere of texto){
      if(caractere.match(/^[a-z0-9]+$/i)) //é alfanumérico
        palavra += caractere
      else{
        if(palavra.length > 0){
          this.tokens.push(palavra)
          palavra=''
        }

        if (!caractere.match(/[\s]/))
          this.tokens.push(caractere)
      }
    }
  } */

  separarPalavras(texto:string){
    let replacer1 = (match,g1)=>match.replace(g1, ' ' + g1);
    let replacer2 = (match,g1)=>match.replace(g1, g1 + ' ');
    
    texto = texto.trim();
    texto = texto.replace(/>([^\s]+)/g,replacer1);
    texto = texto.replace(/([^\s]+)</g,replacer2);

    return texto.split(/(?<!<[^<>]*)\s+|\s+(?![^<>]*>)/); //considera apenas espaços fora de tags
  }

  marcarLinhasEmBranco(texto:string){
    texto = texto.replace(/(\n[ \t\f\v]*(?:\r[ \t\f\v]*|\n[ \t\f\v]*)+)/g, (match, g1)=>match.replace(g1, ' ' + this.caractereLinhasEmBranco + ' '));
    return texto;
  }

  isolarMarcacoesDeTempo(texto:string, regexTempo, regexTempoEtiquetado){
    texto = texto.replace(regexTempo, (match, g1, g2)=>match.replace(g1, '\u26F7' + g1).replace(g2, g2 + '\u26F7'));
    texto = texto.replace(regexTempoEtiquetado, (match, g1, g2)=>match.replace(g1, '\u26F7' + g1).replace(g2, g2 + '\u26F7'));
    //console.log(texto);
    return texto.split(/\u26F7/);
  } 

}

export interface Contexto {
  contexto_esquerda: string;
  palavra_chave: {keyword:string, time:string};
  contexto_direita: string;
}
