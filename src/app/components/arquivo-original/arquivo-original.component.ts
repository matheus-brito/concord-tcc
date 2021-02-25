import { Component, OnInit, Input, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-arquivo-original',
  templateUrl: './arquivo-original.component.html',
  styleUrls: ['./arquivo-original.component.css']
})
export class ArquivoOriginalComponent implements OnInit, AfterViewInit {

  @ViewChild('arquivoOriginal') textArea;

  @Input() tabSelecionada;
  @Input() formData;
  @Input() textoClicado;
  scrollTop;
  scrollTopAux;
  selectionStart;
  selectionEnd;
  atualizarSelecao;

  constructor() { }

  ngOnInit(): void {
    this.lerTexto();
  }

  ngAfterViewInit(){
    this.textArea.nativeElement.onscroll = event => this.scrollTop = event.target.scrollTop;
  }

  ngOnChanges(changes){

    if(changes.formData && !changes.formData.firstChange){
      this.lerTexto();
      this.textoClicado = null;
      this.selectionStart = this.selectionEnd = this.scrollTop = 0; 
    }

    if(changes.textoClicado && !changes.textoClicado.firstChange){
      this.obterRangeASelecionar();
      this.atualizarSelecao = true;
    }

    if(changes.tabSelecionada && !changes.tabSelecionada.firstChange && this.tabSelecionada){
      //console.log(this.atualizarSelecao)
      if(this.atualizarSelecao){
        this.destacarTexto();
        this.atualizarSelecao = false;
      } else {
        //console.log('mudando para:' + this.scrollTop)
        this.atualizarScrollTopDoElemento(this.scrollTop || 0);
      }
    }
    
  }

  destacarTexto(){
    this.textArea.nativeElement.focus();
    
    this.rolarParaAreaSelecionada();
    
    this.textArea.nativeElement.focus();
    //console.log(`${this.textArea.nativeElement.scrollTop} ${this.selectionStart} ${this.selectionEnd}`);
    
    this.textArea.nativeElement.setSelectionRange(this.selectionStart, this.selectionEnd);
    
    this.atualizarScrollTopDoElemento(this.scrollTopAux);
  }

  lerTexto(){
    if(this.formData.arquivoURL){
      let reader = new FileReader();
      let readerTesteISO = new FileReader();
      
      reader.onload = () => {
        this.textArea.nativeElement.value = reader.result;
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

  rolarParaAreaSelecionada() {
    const fullText = this.textArea.nativeElement.value;

    //preencher com a substring, rolar até o final, depois voltar para o texto original
    this.textArea.nativeElement.value = fullText.substring(0, this.selectionEnd);

    //console.log(this.textArea.nativeElement.scrollHeight);
    
    this.atualizarScrollTopDoElemento(this.textArea.nativeElement.scrollHeight);
    
    //necessário para contornar bug de ir para o fim do texto na primeira busca
    this.scrollTopAux = this.textArea.nativeElement.scrollTop;
    
    this.textArea.nativeElement.value = fullText;
  }

  atualizarScrollTopDoElemento(novoScrollTop: number) { 
    this.textArea.nativeElement.scrollTop = novoScrollTop;
  }

  obterRangeASelecionar() {
    let regexBuscaPorToken = this.gerarRegexBusca();
    
    let matches = this.textArea.nativeElement.value.matchAll(regexBuscaPorToken);

    let arrayMatches = Array.from(matches);

    if(!arrayMatches || arrayMatches.length <= this.textoClicado.dados.indice){
      alert("Ocorrência não encontrada. Verifique se digitou o texto corretamente na busca.");
      return;
    }

    //console.log(this.textoClicado);
    //console.log(arrayMatches);

    let ocorrenciaEncontrada = arrayMatches[this.textoClicado.dados.indice];

    let indiceInicio = ocorrenciaEncontrada['index'];

    //console.log(this.textArea.nativeElement.value.substring(indiceInicio, indiceInicio + ocorrenciaEncontrada[0].length))

    this.selectionStart = indiceInicio;
    this.selectionEnd = indiceInicio + ocorrenciaEncontrada[0].length;
  }

  gerarRegexBusca() {
    let flags = this.formData.caseSensitive?  'gm': 'gmi';

    let stringRegex = this.gerarStringRegex();
    
    //console.log(stringRegex)
    let regexBuscaPorToken = new RegExp(stringRegex, flags) 
    
    return regexBuscaPorToken;
  }

  gerarStringRegex() {
    let regexComecaComTag = new RegExp(/^<.*>.*$/);
    let regexTerminaComTag = new RegExp(/^.*<.*>$/);

    let stringPontuacao = '[!\\.,;\\:\\?\'\"_\\-\\(\\)\\{\\}\\[\\]<>]*';
    let stringTags = '(?:<[^<>]+>)*';
    let stringAntesToken = '';
    let stringDepoisToken = '';

    let token = this.formData.token.trim();
    
    if(!regexComecaComTag.test(token)){
      stringAntesToken = `(?<=(?:^|\\s)${stringTags}${stringPontuacao})`;
    }

    if(!regexTerminaComTag.test(token)){
      stringDepoisToken = `(?=${stringPontuacao}${stringTags}(?:$|\\s))`;
    }

    let tokenFormatado = this.escapeRegExp(token)
                          .replace(new RegExp(/(\s*<[^<>]+>\s*)/g), (match,g1)=>match.replace(g1, '\\s*' + g1.trim() + '\\s*'))
                          .replace(new RegExp(/(?<!<[^<>]*)\s+|\s+(?![^<>]*>)/g), '\\s+');

    //console.log(tokenFormatado);
    return stringAntesToken + tokenFormatado + stringDepoisToken;
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
}
