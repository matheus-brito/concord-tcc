import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'concord-tcc';
  uploadedText;
  resultLines = ['aaa <span>ABC</span> dfjsdkl','bbb'];
  lineCount = 0;
  tokens = [];
  concordForm;
  
  onUploadButtonChange(event){
    if(event.target.files && event.target.files[0]){
      let reader = new FileReader();
      reader.onload = () => {
        this.uploadedText = reader.result;
      }
      reader.readAsText(event.srcElement.files[0]);
    }
  }

  onExecuteButtonChange(){
    this.uploadedText = this.uploadedText.replace(/(^\s*)|(\s*$)/gi,"");//exclude  start and end white-space
    this.uploadedText = this.uploadedText.replace(/[ ]{2,}/gi," ");//2 or more space to 1
    this.uploadedText = this.uploadedText.replace(/\n /,"\n"); // exclude newline with a start spacing
  }

  concordanciador(tokenBuscado:string, esquerda:number, direita:number, caseSensitive:boolean){
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
        this.resultLines.push(textoEsquerda + ' ' + tokenBuscado + ' ' + textoDireita);
      }
    })

  }

  tokenizar(texto:string){ 
    let palavra = ''
    for (let caractere of texto){
      if(caractere.match(/^[a-z0-9]+$/i)) //é alfanumérico
        palavra += caractere
      else{
        if (!caractere.match(/[\s]/))
          this.tokens.push(caractere)
        
        if(palavra.length > 0){
          this.tokens.push(palavra)
          palavra=''
        }
      }
    }
  }
}
