import { Component, OnInit } from '@angular/core';
import {FormGroup, FormBuilder, Validators, AbstractControl} from '@angular/forms';
import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';

@Component({
  selector: 'app-concord-form',
  templateUrl: './concord-form.component.html',
  styleUrls: ['./concord-form.component.css']
})
export class ConcordFormComponent implements OnInit {
  concordForm;
  uploadedText;

  constructor(private formBuilder: FormBuilder, private iconRegistry: MatIconRegistry, 
              private sanitizer: DomSanitizer) {
    iconRegistry.addSvgIcon(
      'xIcon',
      sanitizer.bypassSecurityTrustResourceUrl('../assets/img/xIcon.svg'));
  }

  ngOnInit(): void {
    this.concordForm = this.formBuilder.group({
      arquivoConteudo:[this.uploadedText, null],
      arquivo:[null, [Validators.required, this.textExtensionValidator]],
      video:[null, null],
      videoPath:[null, null],
      token:[null,[Validators.required]],
      tokensEsquerda:[null,[Validators.required, Validators.min(1)]],
      tokensDireita:[null,[Validators.required,Validators.min(1)]],
      ignorarTags:[null, null],
      ignorarTempo:[null, null]
    });
  }

  submit(){
    if(this.concordForm.invalid){
      this.concordForm.markAllAsTouched();
      return;
    }
    else
      console.log("Submit");
  }

  onChangeUploadTextButton(event){
    if(event.target.files && event.target.files[0]){
      let reader = new FileReader();
      reader.onload = () => {
        this.uploadedText = reader.result;
        this.concordForm.controls.arquivo.setValue(event.target.files[0].name);
        this.concordForm.controls.arquivo.touched = true;
      }
      reader.readAsText(event.srcElement.files[0]);
    }
  }

  onChangeSelectVideoButton(event){
    if(event.target.files && event.target.files[0]){
      this.concordForm.controls.video.setValue(event.target.files[0].name);
      this.concordForm.controls.videoPath.setValue(event.target.files[0]);
    }
  }

  onClickDeleteIconTexto(){
    this.concordForm.controls.arquivo.setValue(null);
    this.concordForm.controls.arquivo.touched = true;
  }

  onClickDeleteIconVideo(){
    this.concordForm.controls.video.setValue(null);
  }

  textExtensionValidator(control:AbstractControl):{[key:string]:boolean}|null {
    if(control.value == null)
      return null;
    else if(control.value.match(/^.*.(txt|srt)$/))
      return null;
    else
      return {'textExtensionValidator':true};
  }
}
