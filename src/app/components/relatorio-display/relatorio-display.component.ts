import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-relatorio-display',
  templateUrl: './relatorio-display.component.html',
  styleUrls: ['./relatorio-display.component.css']
})
export class RelatorioDisplayComponent implements OnInit {
  @Input() formData;
  fileText;
  legendas=[];
  tags=[];
  tagsDistintas=[];
  relacaoTags = [];

  constructor() { }

  ngOnInit(){
    this.processarTexto();
  }

  ngOnChanges(changes){
    if(changes.formData && !changes.formData.firstChange){
      this.processarTexto();
    }
  }

  processarTexto(){
    if(this.formData.arquivoURL){
      let reader = new FileReader();
      let readerTesteISO = new FileReader();
      
      reader.onload = () => {
        this.fileText = reader.result;
       
        let regexTagGlobal = new RegExp(/<[^/\s<>](?:\s*[^\s<>]*)+>/g); //não considera tags de fechamento
        let regexStringVazia = new RegExp(/^$/);
        this.tags = this.fileText.match(regexTagGlobal);
        
        if(this.tags.length > 0){
          this.tags.sort();
          this.tagsDistintas = this.obterTagsDistintas();
          console.log(this.tags)
          console.log(this.tagsDistintas)
          this.relacaoTags = this.obterRelacoes(regexTagGlobal);
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
    let tagsAux = [];
    let tagAtual = this.tags[0];
    let count = 1;

    for(let i = 1; i < this.tags.length; ++i){
      if(tagAtual == this.tags[i]){
        ++count;
      }
      else{
        tagsAux.push({tag: tagAtual, numOcorrencias:count});
        tagAtual = this.tags[i];
        count = 1;
      }
    }

    //adicionar última tag (ou primeira caso length == 1)
    tagsAux.push({tag: tagAtual, numOcorrencias:count});

    return tagsAux;
  }

  obterRelacoes(regexTagGlobal){
    let texto = this.fileText;
    let legendas;
    let tagsLegenda;
    let relacoes = this.construirMatrizRelacoes();
    
    console.log(relacoes)

    texto = this.formatarTagsTexto(texto);
    //console.log(texto);
    legendas = texto.split(/\n[ \t\f\v]*(?:\r[ \t\f\v]*|\n[ \t\f\v]*)+/); //separando por linhas em branco
    //legendas = texto.split(/(?:[\n\r]|[\n\n]){2,}/); //separando por linhas em branco
    //console.log(legendas);
    
    legendas.forEach((legenda, indice) => {
      tagsLegenda = legenda.match(regexTagGlobal);
      
      if(tagsLegenda != null){
        for(let i = 0; i < tagsLegenda.length;++i){
          tagsLegenda[i] = Number(tagsLegenda[i].replace('<','').replace('>',''));
        }

        for(let i = 0; i < tagsLegenda.length;++i){
          for(let j = i+1; j < tagsLegenda.length;++j){
            ++relacoes[tagsLegenda[i]][tagsLegenda[j]];
            ++relacoes[tagsLegenda[j]][tagsLegenda[i]];
          }
        }

        console.log(legenda);
        console.log(tagsLegenda);
      }
    });
    return relacoes;
  }

  formatarTagsTexto(texto:string){
    let regexAux;
    this.tagsDistintas.forEach((dadosTag, indice)=>{
      regexAux = new RegExp(dadosTag.tag, 'g');
      texto = texto.replace(regexAux, '<' + indice + '>');
    });

    return texto;
  }

  construirMatrizRelacoes(){
    let relacoes = new Array(this.tagsDistintas.length);
    
    for(let i = 0; i < relacoes.length; ++i){
      relacoes[i] = new Array(this.tagsDistintas.length);
      relacoes[i].fill(0);
    }

    return relacoes;
  }
}
