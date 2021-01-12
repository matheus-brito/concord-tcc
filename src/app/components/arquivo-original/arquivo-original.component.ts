import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-arquivo-original',
  templateUrl: './arquivo-original.component.html',
  styleUrls: ['./arquivo-original.component.css']
})
export class ArquivoOriginalComponent implements OnInit {

  @Input() formData;
  fileText;

  constructor() { }

  ngOnInit(): void {
    this.lerTexto();
  }

  ngOnChanges(changes){

    if(changes.formData && !changes.formData.firstChange){
      this.lerTexto();
    }
  }

  lerTexto(){
    if(this.formData.arquivoURL){
      let reader = new FileReader();
      let readerTesteISO = new FileReader();
      
      reader.onload = () => {
        this.fileText = reader.result;
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

}
