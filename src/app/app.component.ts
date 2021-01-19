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
  formData = null;
  videoTime = null;
  tabsVisible:boolean = false;

  updateTabs(){
    this.formData = this.form.concordForm.value;
    this.tabsVisible = true;
    this.tabs.selectedIndex = 1;
  }
  hideTabs(){
    this.tabsVisible = false;
  }

  changeVideoTime(time){
    this.videoTime = {newTime:time};
  }
  onVideoTimeChange(){
    if(!this.videoDisplay.first.player.isInPictureInPicture())
      this.tabs.selectedIndex = 3;
  }
}
