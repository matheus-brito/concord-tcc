import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-lines-display',
  templateUrl: './lines-display.component.html',
  styleUrls: ['./lines-display.component.css']
})
export class LinesDisplayComponent implements OnInit {
  
  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  
  lines = []
  colunasTabela: string[] = ['contexto_esquerda', 'palavra_chave', 'contexto_direita'];
  linhasTabela;// = new MatTableDataSource<PeriodicElement>([{position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'}]);
  formData;
  fileText;
  palavras= [];

  constructor(private router: Router) { 
    this.formData = this.router.getCurrentNavigation().extras.state;
  }

  ngOnInit(): void {
    this.processarDadosFormulario();
  }

  processarDadosFormulario(){
    if(this.formData.arquivoURL){
      let reader = new FileReader();
      reader.onload = () => {
        this.fileText = reader.result;
        let regexMarcacaoTempo = new RegExp(/([1-9])\d*\s+\d{2}\:\d{2}\:\d{2},\d{3} --> \d{2}\:\d{2}(\:\d{2},\d{3})/g);
        let regexTag = new RegExp(/^<[^\s]+>$/);
        let palavrasAux = this.isolarMarcacoesDeTempo(this.fileText, regexMarcacaoTempo);
        
        palavrasAux.forEach((texto, indice)=>{
          if(regexMarcacaoTempo.test(texto)){
            this.palavras.push(texto);

            if(!this.formData.ignorarTempo)
              this.palavras.push(...this.separarPalavras(texto));
          }
          else
            this.palavras.push(...this.separarPalavras(texto));
        });

        this.lines = this.concordanciador(this.palavras,this.separarPalavras(this.formData.token), this.formData.tokensEsquerda,
                                          this.formData.tokensDireita, this.formData.caseSensitive,  this.formData.ignorarTags, 
                                          regexMarcacaoTempo, regexTag);
        this.linhasTabela = new MatTableDataSource<Contexto>(this.lines);
        this.linhasTabela.paginator = this.paginator;
        console.log(this.palavras);
      }
      reader.readAsText(this.formData.arquivoURL);
    }
  }

  concordanciador(listaPalavras,termoBuscado:string[], esquerda:number, 
                  direita:number, caseSensitive:boolean, igonorarTags:boolean,
                  regexMarcacaoTempo, regexTag){
    let linhasConcord=[];
    
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
          for(let i = indice-1; i >= 0 && contadorPalavras < esquerda; --i){
            if(!regexMarcacaoTempo.test(listaPalavras[i]) &&
              (!regexTag.test(listaPalavras[i]) || !igonorarTags)){
              textoEsquerda = listaPalavras[i] + ' ' + textoEsquerda;
              ++contadorPalavras;
            }
          }

          contadorPalavras = 0;
          for(let i = indice + termoBuscado.length; i < listaPalavras.length && contadorPalavras < direita ;++i){
            if(!regexMarcacaoTempo.test(listaPalavras[i]) &&
              (!regexTag.test(listaPalavras[i]) || !igonorarTags)){
              textoDireita += listaPalavras[i] + ' ';
              ++contadorPalavras;
            }
          }
          linhasConcord.push({contexto_esquerda: textoEsquerda.trim(), palavra_chave: termoEncontrado, contexto_direita: textoDireita.trim()});
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
    return texto.split(/\s+/);
  }

  isolarMarcacoesDeTempo(texto:string, regex){
    texto = texto.replace(regex, (match, g1, g2)=>match.replace(g1, '\u0F12 ' + g1).replace(g2, g2 + ' \u0F12'));
    return texto.split(/\u0F12/);
  } 

}

export interface Contexto {
  contexto_esquerda: string;
  palavra_chave: string;
  contexto_direita: string;
}
