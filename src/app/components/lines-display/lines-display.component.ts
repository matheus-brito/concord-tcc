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
  formularioContemPalavraChave = true;
  palavras = [];
  stringLinhasEmBranco = '\u26F8\u26F8';
  stringIdentficadorTempoControle = '\u2711\u2711';
  stringIdentficadorTempo = '\u26F2\u26F2';
  stringPontuacao = '[!\\.,;\\:\\?\'\"_\\-\\(\\)\\{\\}\\[\\]]*';
  defaultPageSize = 10;
  ocorrenciasEncontradas = true;

  constructor() {}

  ngOnInit(){
    if(this.formData.token){
      this.formularioContemPalavraChave = true;
      this.processarDadosFormulario();
    } else{
      this.formularioContemPalavraChave = false;
    }
  }

  ngOnChanges(changes){
    if(changes.formData && !changes.formData.firstChange){
      if(this.formData.token){
        this.ocorrenciasEncontradas = true; //resetando boolean
        
        this.formularioContemPalavraChave = true;
        this.processarDadosFormulario();
      } else{
        this.formularioContemPalavraChave = false;
      }
    }
  }

  onPalavraChaveClick(textoClicado){
    this.onKeywordClick.emit(textoClicado);
  }

  processarDadosFormulario(){
    if(this.formData.arquivoURL){
      let reader = new FileReader();
      let readerTesteISO = new FileReader();
      
      reader.onload = () => {
        this.fileText = reader.result;
        let palavrasSeparadas;
        //let regexMarcacaoTempoEtiquetado = new RegExp(/^(\d{2})\:\d{2}\:\d{2},\d{3}\s*-->\s*\d{2}\:\d{2}(\:\d{2},\d{3})$/);
        let regexMarcacaoTempoGlobal = new RegExp(/\u26F8{2}\s*(?:<[^<>]+>\s*)*\s*([1-9]\d*\s*){0,1}\s*(?:<[^<>]+>\s*)*\s*(\d{2}\:\d{2}\:\d{2},\d{3}\s*-->\s*\d{2}\:\d{2}\:\d{2},\d{3})/g);
        let regexMarcacaoTempo = new RegExp(/\d{2}\:\d{2}\:\d{2},\d{3}\s*-->\s*\d{2}\:\d{2}(\:\d{2},\d{3})/);
        //let regexMarcacaoTempoGlobal = new RegExp(/([1-9])\d*\s+\d{2}\:\d{2}\:\d{2},\d{3}\s*-->\s*\d{2}\:\d{2}(\:\d{2},\d{3})/g);
        let regexTag = new RegExp(/^<(?:[^\s<>]+\s*)+>$/);
        let regexStringVazia = new RegExp(/^$/);
        let regexIdentificadorTempoControle = new RegExp(this.stringIdentficadorTempoControle,'');
        let regexIdentificadorTempo = new RegExp(this.stringIdentficadorTempo,'');
        let textoAux = this.marcarLinhasEmBranco(this.fileText);
        textoAux = this.stringLinhasEmBranco + ' ' + textoAux;
        let palavrasAux = this.isolarMarcacoesDeTempo(textoAux, regexMarcacaoTempoGlobal);
        this.palavras = [];
        //console.log(palavrasAux)
        palavrasAux.forEach((texto, indice)=>{
            if(regexIdentificadorTempoControle.test(texto)){
              this.palavras.push(texto);

                palavrasSeparadas = this.separarPalavras(texto.replace(regexIdentificadorTempoControle, ''));
                for(let i = 0; i < palavrasSeparadas.length; ++i){
                  palavrasSeparadas[i] = this.stringIdentficadorTempo + palavrasSeparadas[i];
                }

                this.palavras.push(...palavrasSeparadas);
            }
            else{
              this.palavras.push(...this.separarPalavras(texto));
            }
        });
        this.palavras = this.palavras.filter((valor)=>!(regexStringVazia.test(valor)));
        //console.log(this.palavras)
        this.lines = this.concordanciador(this.palavras,this.separarPalavras(this.formData.token), this.formData.tokensEsquerda,
                                          this.formData.tokensDireita, this.formData.caseSensitive,  this.formData.ignorarTags, 
                                          this.formData.ignorarTempo, regexMarcacaoTempo, regexIdentificadorTempoControle,
                                          regexIdentificadorTempo, regexTag);
         
        this.linhasTabela = new MatTableDataSource<Contexto>(this.lines);
        this.linhasTabela.paginator = this.paginator;
        this.linhasTabela.paginator.firstPage();
        this.paginator.pageSize = this.defaultPageSize;
        
        if(this.lines.length == 0){
          this.ocorrenciasEncontradas = false;
        }   
        //console.log(this.lines);
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

  concordanciador(listaPalavras,termoBuscadoOriginal:string[], esquerda:number, 
                  direita:number, caseSensitive:boolean, igonorarTags:boolean,
                  ignorarTempo:boolean, regexMarcacaoTempo, regexIdentificadorTempoControle, 
                  regexIdentificadorTempo, regexTag){
    let linhasConcord=[];
    
    let indexBusca;
    let tempoLegenda = '';
    let termoEncontrado;
    let contadorPalavras;
    let regexTeste;
    let regexIgnoreCaseFlag='';
    let textoEsquerda:string, textoDireita:string;
    let estaNaMesmaLegenda = false; //true se ainda estamos na mesma legenda onde uma ocorrencia foi encontrada
    textoEsquerda = textoDireita = '';

    if(!caseSensitive)
      regexIgnoreCaseFlag = 'i';
    
    let termoBuscado = this.escaparTermoBuscado(termoBuscadoOriginal);

    listaPalavras.forEach((palavra,indice) => {
      if(termoBuscado.length == 1)
        regexTeste = new RegExp('^' + this.stringPontuacao + termoBuscado[0] + this.stringPontuacao +'$', regexIgnoreCaseFlag);
      else
        regexTeste = new RegExp('^' + this.stringPontuacao + termoBuscado[0] + '$', regexIgnoreCaseFlag);  
      
      palavra = palavra.replace(regexIdentificadorTempo, '');

      if(palavra == this.stringLinhasEmBranco){
        estaNaMesmaLegenda = false;
        tempoLegenda = '';
      }
      else if(regexIdentificadorTempoControle.test(palavra)){
        if(regexMarcacaoTempo.test(palavra)){
          tempoLegenda = palavra;
          if(estaNaMesmaLegenda){
            if(linhasConcord[linhasConcord.length-1].palavra_chave.time == ''){
              linhasConcord[linhasConcord.length-1].palavra_chave.time = palavra;
            }
          }
        }
      }
      else{
        if(regexTeste.test(palavra)){
          termoEncontrado = this.buscarTermo(listaPalavras, indice, termoBuscado, regexIgnoreCaseFlag, regexIdentificadorTempo);
          
          if(termoEncontrado != null){
            contadorPalavras = 0;
            estaNaMesmaLegenda = true;

            for(indexBusca = indice-1; indexBusca >= 0 && contadorPalavras < esquerda; --indexBusca){
              if(!(regexIdentificadorTempoControle.test(listaPalavras[indexBusca])) &&
                listaPalavras[indexBusca] != this.stringLinhasEmBranco){
                if((!regexTag.test(listaPalavras[indexBusca]) || !igonorarTags) &&
                  (!regexIdentificadorTempo.test(listaPalavras[indexBusca]) || !ignorarTempo)){
                  textoEsquerda = listaPalavras[indexBusca].replace(regexIdentificadorTempo, '') + 
                                  ' ' + textoEsquerda;
                  ++contadorPalavras;
                }
              }
            }

            contadorPalavras = 0;
            for(let i = indice + termoBuscado.length; i < listaPalavras.length && contadorPalavras < direita ;++i){
              if(!regexIdentificadorTempoControle.test(listaPalavras[i]) &&
                listaPalavras[i] != this.stringLinhasEmBranco &&
                (!regexTag.test(listaPalavras[i]) || !igonorarTags) &&
                (!regexIdentificadorTempo.test(listaPalavras[i]) || !ignorarTempo)){
                textoDireita += listaPalavras[i].replace(regexIdentificadorTempo,'') + 
                                ' ';
                ++contadorPalavras;
              }
            }

            //tempoLegenda = this.encontrarTempoLegenda(listaPalavras, indice, regexMarcacaoTempo, regexIdentificadorTempoControle);
            
            //console.log("Saiu");
            linhasConcord.push({contexto_esquerda: textoEsquerda.trim(), palavra_chave: {keyword:termoEncontrado, time:tempoLegenda, indice: linhasConcord.length}, contexto_direita: textoDireita.trim()});
            textoEsquerda = textoDireita = '';
          }
        }
      }
    })
    return linhasConcord;
  }

  buscarTermo(listaPalavras, indice, termoBuscado:string[], 
              regexIgnoreCaseFlag, regexIdentificadorTempo){
    let termoEncontrado = null;
    let palavraAtual;
    let palavra = listaPalavras[indice].replace(regexIdentificadorTempo, '');
    
    if(termoBuscado.length == 1){
      termoEncontrado = palavra;
    }
    else if(indice + termoBuscado.length <= listaPalavras.length){
      termoEncontrado = palavra;
      for(let i = 1; i < termoBuscado.length-1; ++i){
        palavraAtual = listaPalavras[indice+i].replace(regexIdentificadorTempo, '');
        if(new RegExp('^'+termoBuscado[i]+'$', regexIgnoreCaseFlag).test(palavraAtual)){
          termoEncontrado += ' ' + palavraAtual;
        }
        else{
          termoEncontrado = null;
          break;
        }
      }
      if(termoEncontrado != null){
        palavraAtual = listaPalavras[indice + termoBuscado.length-1].replace(regexIdentificadorTempo, '');
        if(new RegExp('^'+termoBuscado[termoBuscado.length-1]+ this.stringPontuacao +'$').test(palavraAtual)){
          termoEncontrado += ' ' + palavraAtual;
        }
        else{
          termoEncontrado = null;
        }
      }
    }

    return termoEncontrado;
  }

 /*  encontrarTempoLegenda(listaPalavras, indice, regexMarcacaoTempo, regexIdentificadorTempoControle){
    //console.log("Entrou");
    for(let i = indice; i >=0 && listaPalavras[i] != this.stringLinhasEmBranco; --i){
      if(regexIdentificadorTempoControle.test(listaPalavras[i]) && regexMarcacaoTempo.test(listaPalavras[i])){
        return listaPalavras[i];
      }
    }

    for(let i = indice; i < listaPalavras.length && listaPalavras[i] != this.stringLinhasEmBranco; ++i){
      if(regexIdentificadorTempoControle.test(listaPalavras[i]) && regexMarcacaoTempo.test(listaPalavras[i])){
        return listaPalavras[i];
      }
    }

    return '';
  } */

  separarPalavras(texto:string){
    let replacer1 = (match,g1)=>match.replace(g1, g1 + ' ');
    let replacer2 = (match,g1)=>match.replace(g1, ' ' + g1);
    
    texto = texto.trim();
    texto = texto.replace(/(>)[^\s]/g,replacer1);
    texto = texto.replace(/[^\s](<)/g,replacer2);

    return texto.split(/(?<!<[^<>]*)\s+|\s+(?![^<>]*>)/); //considera apenas espaços fora de tags
  }

  marcarLinhasEmBranco(texto:string){
    texto = texto.replace(/(\n[ \t\f\v]*(?:\r[ \t\f\v]*|\n[ \t\f\v]*)+)/g, (match, g1)=>match.replace(g1, ' ' + this.stringLinhasEmBranco + ' '));
    return texto;
  }

  isolarMarcacoesDeTempo(texto:string, regexTempo){
    let marcacaoTempoAux = '\u26F7\u26F7';
    texto = texto
            .replace(regexTempo, 
                (match, g1, g2)=>match
                                .replace(g1, marcacaoTempoAux + this.stringIdentficadorTempoControle + 
                                             g1 + marcacaoTempoAux)
                                .replace(g2, marcacaoTempoAux + this.stringIdentficadorTempoControle + 
                                            g2 + marcacaoTempoAux)
            );
    //texto = texto.replace(regexTempoEtiquetado, (match, g1, g2)=>match.replace(g1, '\u26F7' + g1).replace(g2, g2 + '\u26F7'));
    //console.log(texto);
    return texto.split(new RegExp(marcacaoTempoAux));
  } 

  escaparTermoBuscado (termoBuscado:string[]):string[] {
    return termoBuscado.map(this.escapeRegExp);
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
}

export interface Contexto {
  contexto_esquerda: string;
  palavra_chave: {keyword:string, time:string};
  contexto_direita: string;
}
