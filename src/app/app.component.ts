import { Component, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { ConcordFormComponent } from './components/concord-form/concord-form.component';
import { LinesDisplayComponent } from './components/lines-display/lines-display.component';
import { VideoDisplayComponent } from './components/video-display/video-display.component';
import { MatTabGroup } from '@angular/material/tabs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent{
  @ViewChild(ConcordFormComponent, {static:true}) form!:ConcordFormComponent;
  @ViewChild(LinesDisplayComponent, {static:true}) linesDisplay!:LinesDisplayComponent;
  @ViewChild('tabs') tabs: MatTabGroup;
  @ViewChildren('videoDisplay') videoDisplay!:QueryList<VideoDisplayComponent>;

  activeTabIndex;
  tabArquivoOriginalSelecionada = false;
  formData = null;
  videoTime = null;
  tabsVisible:boolean = false;
  textoClicado = null;

  updateTabs(){
    this.formData = this.form.concordForm.value;
    this.tabsVisible = true;
    this.tabs.selectedIndex = 1;
  }
  hideTabs(){
    this.tabsVisible = false;
  }

  onTabChange(event){
    if(event.index === 2){
      this.tabArquivoOriginalSelecionada = true;
    }
    else{
      this.tabArquivoOriginalSelecionada = false;
    }
  }

  changeVideoTime(time){
    this.videoTime = {newTime:time};
  }
  onVideoTimeChange(){
    if(!this.videoDisplay.first.player.isInPictureInPicture()){
      this.tabs.selectedIndex = 3;
    }
  }

  onTextoClicado(textoClicado) {
    //console.log(tempoInicio)
    this.textoClicado = {dados: textoClicado};
    
    if(this.formData.videoData){
      let tempoInicio = this.buscarTempoInicio(textoClicado.time);
      if(tempoInicio != ''){
        this.videoTime = {newTime:this.converterParaSegundos(tempoInicio)};
        return;
      }
    }
     
    this.tabs.selectedIndex = 2;
  }

  converterParaSegundos(tempo){
    let tempoAux = tempo.replace(/,/, '\:').split(/\:/);
    let segundos;
    segundos = Number(tempoAux[0])*(60**2) + Number(tempoAux[1])*60 + 
               Number(tempoAux[2]) + Number(tempoAux[3]/1000);
    //console.log(segundos)
    return segundos;
  }

  buscarTempoInicio(tempoLegenda:string){
    let regex = new RegExp(/(?<tempoInicio>\d{2}\:\d{2}\:\d{2},\d{3})\s*-->/);
    let resultado;
    resultado = tempoLegenda.match(regex)
    if(resultado)
      return resultado.groups.tempoInicio;
    else
      return '';
  }
}
