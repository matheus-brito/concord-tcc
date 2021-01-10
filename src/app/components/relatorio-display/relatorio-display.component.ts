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

  constructor() { }

  ngOnInit(){
    this.processarTexto();
  }

  ngAfterViewInit(){
  }

  ngOnChanges(changes){

    if(changes.formData && !changes.formData.firstChange){
      this.legendas=[];
      this.tags=[];
      this.tagsDistintas={};

      this.processarTexto();
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
}
