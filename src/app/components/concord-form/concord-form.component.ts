import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {FormGroup, NgForm, FormGroupDirective, FormControl, FormBuilder, Validators, AbstractControl} from '@angular/forms';
import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';
import { Router } from '@angular/router';
import { ErrorStateMatcher } from '@angular/material/core';

/** Erro do formulário */
class numTokensErrorMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    let token = control.parent.get('token');
    return form.hasError('numTokens');
  }
}

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
  numTokensErrorMatcher = new numTokensErrorMatcher();
  
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
      arquivoTags:[null, [this.tagsFileExtensionValidator]],
      arquivoTagsURL:[null, null],
      video:[null, [this.videoExtensionValidator]],
      videoData:[null, null],
      token:[null,null],
      tokensEsquerda:[10, null],
      tokensDireita:[10, null],
      caseSensitive: [false, null],
      ignorarTags:[false, null],
      ignorarTempo:[true, null]
    },
    {
      validators: [this.numTokensValidator]
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

  onChangeUploadTagsFileButton(event){
    if(event.target.files && event.target.files[0]){
      this.concordForm.controls.arquivoTags.setValue(event.target.files[0].name);
      this.concordForm.controls.arquivoTagsURL.setValue(event.srcElement.files[0]);
    }
    else{
      this.concordForm.controls.arquivoTags.setValue(null);
      this.concordForm.controls.arquivoTagsURL.setValue(null);
    }
    this.concordForm.controls.arquivoTags.touched = true;
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
    //console.log(id);
    let inputFile:HTMLInputElement = <HTMLInputElement>document.getElementById(id);
    let event = new Event('change');
    inputFile.value = null; 
    inputFile.dispatchEvent(event);
  }

  onKeyDown(event){
    if(event.keyCode == 13){
      event.preventDefault();
      //console.log("Default prevenido!");
      document.getElementById("submit-button").focus();
      document.getElementById("submit-button").click();
      return false;
    }
  }

  textExtensionValidator(control:AbstractControl):{[key:string]:boolean}|null {
    if(control.value == null)
      return null;
    else if(control.value.match(/^.*\.(?:txt|srt)$/))
      return null;
    else
      return {'textExtensionValidator':true};
  }

  videoExtensionValidator(control:AbstractControl):{[key:string]:boolean}|null {
    if(control.value == null)
      return null;
    else if(control.value.match(/^.*\.mp4$/))
      return null;
    else
      return {'videoExtensionValidator':true};
  }

  tagsFileExtensionValidator(control:AbstractControl):{[key:string]:boolean}|null {
    if(control.value == null)
      return null;
    else if(control.value.match(/^.*\.txt$/))
      return null;
    else
      return {'tagsFileExtensionValidator':true};
  }

  numTokensValidator(formGroup: FormGroup) {
    let token = formGroup.get('token');
    if (token.value) {
      let tokensEsquerda = formGroup.get('tokensEsquerda');
      let tokensDireita = formGroup.get('tokensDireita');
      
      if(!tokensEsquerda.value || !tokensDireita.value){
        return { numTokens: true }
      }
      return null;
    }
    return null;
  }
}
