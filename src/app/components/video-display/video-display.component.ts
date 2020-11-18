import { Component, ElementRef, Input, OnDestroy, 
         ViewChild, ViewEncapsulation } from '@angular/core';
import videojs from 'video.js';

@Component({
  selector: 'app-video-display',
  templateUrl: './video-display.component.html',
  styleUrls: ['./video-display.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class VideoDisplayComponent implements OnDestroy {
  @ViewChild('target',{static:true}) target:ElementRef;

  @Input() videoSource;
  @Input() time;
  @Input() subtitle;
  player: videojs.Player;
  constructor(private elementRef: ElementRef) { }

  ngOnChanges(changes){
    //(<HTMLVideoElement>(<unknown>this.target)).src=this.src;
    if(changes.videoSource){
      if(!this.player)
        this.player = videojs(this.target.nativeElement, null);
      this.player.src(this.videoSource)
    }
    if(changes.time){
      this.player.currentTime(this.time);
      this.player.play();
    }
    if(changes.subtitle){
      this.player.addRemoteTextTrack(this.subtitle, false);
      console.log(this.player.remoteTextTracks().length())
    }
  }

  removeAllTextTracks(){
    //this.player.remoteTextTracks()
  }

  ngOnDestroy(): void {
    if (this.player) {
      this.player.dispose();
    }
  }

}
