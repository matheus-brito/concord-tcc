import { Component, OnInit, Input} from '@angular/core';

@Component({
  selector: 'app-relatorio-display',
  templateUrl: './relatorio-display.component.html',
  styleUrls: ['./relatorio-display.component.css']
})
export class RelatorioDisplayComponent implements OnInit {
  @Input() formData;

  regexTagGlobal = new RegExp(/<[^/\s<>](?:\s*[^\s<>]*)+>/g); //não considera tags de fechamento
  
  fileText;
  legendas=[];
  tags=[];
  tagsDistintas={};
  tagsEncontradas = true;
  tagsParaFiltrar = null;

  constructor() { }

  ngOnInit(){
    this.processarDados();
  }

  ngAfterViewInit(){
  }

  ngOnChanges(changes){

    if(changes.formData && !changes.formData.firstChange){
      this.legendas=[];
      this.tags=[];
      this.tagsDistintas={};
      this.tagsParaFiltrar = null;
      this.tagsEncontradas = true;

      this.processarDados();
    }
  }

  processarDados(){
    if(this.formData.arquivoTagsURL){
      this.processarArquivoTagsETexto();
    }
    else{
      this.processarArquivoTexto();
    }
  }

  processarArquivoTexto(){
    if(this.formData.arquivoURL){
      let reader = new FileReader();
      let readerTesteISO = new FileReader();
      
      reader.onload = () => {
        this.fileText = reader.result;

        this.legendas = this.fileText.split(/\n[ \t\f\v]*(?:\r[ \t\f\v]*|\n[ \t\f\v]*)+/); //separando por linhas em branco
        this.tags = this.fileText.match(this.regexTagGlobal);
        
        if(this.tags != null && this.tags.length > 0){
          this.tags.sort();
          this.tagsDistintas = this.obterTagsDistintas();
          //console.log(this.tagsDistintas)
          this.tagsDistintas  = this.filtrarTagsDistintas(this.tagsDistintas);
          
          if(Object.getOwnPropertyNames(this.tagsDistintas) != null &&
             Object.getOwnPropertyNames(this.tagsDistintas).length == 0){
              this.tagsEncontradas = false;
          }
          //console.log(this.tagsDistintas)
        }
        else{
          this.tagsEncontradas = false;
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

  processarArquivoTagsETexto(){
    let reader = new FileReader();
    let readerTesteISO = new FileReader();
    
    reader.onload = () => {
      let texto = reader.result;
      this.tagsParaFiltrar = (texto as string).split(/\r\n|\r|\n/); //separando por linhas
      this.tagsParaFiltrar = this.filtrarTagsValidasNoArquivo(this.tagsParaFiltrar);
      //console.log(this.tagsParaFiltrar)
      this.processarArquivoTexto();
    }

    readerTesteISO.onload = ()=>{
      let isISO:boolean;
      let textoLido = readerTesteISO.result as string;
      let regexISO = new RegExp(/�/);
      isISO = regexISO.test(textoLido);

      if(isISO){
        reader.readAsText(this.formData.arquivoTagsURL, "ISO-8859-1");
      }
      else{
        reader.readAsText(this.formData.arquivoTagsURL);
      }
    }
    
    readerTesteISO.readAsText(this.formData.arquivoTagsURL);
  
  }

  filtrarTagsDistintas(tagsDistintas){
    if(this.tagsParaFiltrar === null ||
      this.tagsParaFiltrar.length == 0){
        //console.log("Retornou mesmo objeto");
        return tagsDistintas;
    }

    Object.getOwnPropertyNames(tagsDistintas).forEach(tagDistinta=>{
      if(!this.tagsParaFiltrar.includes(tagDistinta)){
        delete tagsDistintas[tagDistinta];
      }
    });

    //console.log(tagsDistintas);

    return tagsDistintas;
  }

  filtrarTagsValidasNoArquivo(tags){
    if(tags == null){
      return tags;
    }

    let regexTagQualquer = new RegExp(/<[\s\S]*>/);
    let tagsAux = [];
    tags.forEach(tag => {
      tag = tag.trim();
      if(regexTagQualquer.test(tag)){
        tagsAux.push(tag);
      }
    });

    return tagsAux;
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
}
