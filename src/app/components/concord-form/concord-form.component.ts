import { Component, OnInit } from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';

@Component({
  selector: 'app-concord-form',
  templateUrl: './concord-form.component.html',
  styleUrls: ['./concord-form.component.css']
})
export class ConcordFormComponent implements OnInit {
  concordForm;
  uploadedText;

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.concordForm = this.formBuilder.group({
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

  onUploadButtonChange(event){
    if(event.target.files && event.target.files[0]){
      let reader = new FileReader();
      reader.onload = () => {
        this.uploadedText = reader.result;
      }
      reader.readAsText(event.srcElement.files[0]);
    }
  }

}
