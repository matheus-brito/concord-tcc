import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {FormGroup, FormBuilder, Validators, AbstractControl} from '@angular/forms';
import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-concord-form', 
  templateUrl: './concord-form.component.html',
  styleUrls: ['./concord-form.component.css']
})
export class ConcordFormComponent implements OnInit {
  
  @Output() onValidSubmit: EventEmitter<any> = new EventEmitter();
  @Output() onInvalidSubmit: EventEmitter<any> = new EventEmitter();

  concordForm;
  uploadedText;
  teste; teste2;

  constructor(private formBuilder: FormBuilder, 
              private iconRegistry: MatIconRegistry, 
              private router: Router,
              private sanitizer: DomSanitizer) {
    iconRegistry.addSvgIcon(
      'xIcon',
      sanitizer.bypassSecurityTrustResourceUrl('../assets/img/xIcon.svg'));
  }

  ngOnInit(): void {
    this.concordForm = this.formBuilder.group({
      arquivoURL:[this.uploadedText, null],
      arquivo:[null, [Validators.required, this.textExtensionValidator]],
      video:[null, [this.videoExtensionValidator]],
      videoData:[null, null],
      token:[null,[Validators.required]],
      tokensEsquerda:[10,[Validators.required, Validators.min(1)]],
      tokensDireita:[10,[Validators.required,Validators.min(1)]],
      caseSensitive: [false, null],
      ignorarTags:[false, null],
      ignorarTempo:[true, null]
    });
  }

  submit(){
    if(this.concordForm.invalid){
      this.concordForm.markAllAsTouched();
      this.onInvalidSubmit.emit();
      return;
    }
    else{
      this.onValidSubmit.emit();
    }
  }

  limparForm(){
    this.concordForm.reset();
  }

  onChangeUploadTextButton(event){
    if(event.target.files && event.target.files[0]){
      this.concordForm.controls.arquivo.setValue(event.target.files[0].name);
      this.concordForm.controls.arquivoURL.setValue(event.srcElement.files[0]);
    }
    else{
      this.concordForm.controls.arquivo.setValue(null);
      this.concordForm.controls.arquivoURL.setValue(null);
    }
    this.concordForm.controls.arquivo.touched = true;
  }

  onChangeSelectVideoButton(event){
    if(event.target.files && event.target.files[0]){
      let file = event.srcElement.files[0];
      this.concordForm.controls.video.setValue(file.name);
      this.concordForm.controls.videoData.setValue({src:URL.createObjectURL(file), type: file.type});
    }
    else{
      this.concordForm.controls.video.setValue(null);
      this.concordForm.controls.videoData.setValue(null);
    }
    this.concordForm.controls.video.touched = true;
  }

  onClickDeleteIcon(id:string){
    console.log(id);
    let inputFile:HTMLInputElement = <HTMLInputElement>document.getElementById(id);
    let event = new Event('change');
    inputFile.value = null; 
    inputFile.dispatchEvent(event);
  }

  onKeyDown(event){
    if(event.keyCode == 13){
      event.preventDefault();
      //console.log("Default prevenido!");
      document.getElementById("submit-button").click();
      return false;
    }
  }

  textExtensionValidator(control:AbstractControl):{[key:string]:boolean}|null {
    if(control.value == null)
      return null;
    else if(control.value.match(/^.*.(txt|srt)$/))
      return null;
    else
      return {'textExtensionValidator':true};
  }

  videoExtensionValidator(control:AbstractControl):{[key:string]:boolean}|null {
    if(control.value == null)
      return null;
    else if(control.value.match(/^.*.(mp4|webm)$/))
      return null;
    else
      return {'videoExtensionValidator':true};
  }
}
