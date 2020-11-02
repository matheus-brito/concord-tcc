import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lines-display',
  templateUrl: './lines-display.component.html',
  styleUrls: ['./lines-display.component.css']
})
export class LinesDisplayComponent implements OnInit {
  lines = [];
  formData;
  tokens=[];
  fileText;

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
        this.tokenizar(this.fileText);
        this.concordanciador(this.formData.token, this.formData.tokensEsquerda,
                             this.formData.tokensDireita, true);
        console.log(this.lines);
      }
      reader.readAsText(this.formData.arquivoURL);
    }
  }
  
  concordanciador(tokenBuscado:string, esquerda:number, 
                  direita:number, caseSensitive:boolean){
    this.lines=[];
    
    let isEqual;
    let textoEsquerda:string, textoDireita:string;
    textoEsquerda = textoDireita = '';

    if(caseSensitive){
      isEqual = (str1:string, str2:string) => str1 === str2;
    }
    else{
      tokenBuscado = tokenBuscado.toLowerCase();
      isEqual = (str1:string, str2:string) => str1 === str2.toLowerCase();
    }
    this.tokens.forEach((token,indice) => {
      if(isEqual(tokenBuscado, token)){
        for(let i = Math.max(0, indice - esquerda); i < indice;++i){
          textoEsquerda += this.tokens[i];
        }
        for(let i = indice + 1; i <= Math.min(indice+direita, this.tokens.length - 1) ;++i){
          textoDireita += this.tokens[i];
        }
        this.lines.push(textoEsquerda + ' ' + tokenBuscado + ' ' + textoDireita);
        textoEsquerda = textoDireita = '';
      }
    })
  }

  tokenizar(texto:string){ 
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
  }

}
