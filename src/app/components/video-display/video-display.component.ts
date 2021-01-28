import { Component, ElementRef, Input, Output,
         EventEmitter, OnDestroy, ViewChild, 
         ViewEncapsulation } from '@angular/core';
import videojs from 'video.js';

@Component({
  selector: 'app-video-display',
  templateUrl: './video-display.component.html',
  styleUrls: ['./video-display.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class VideoDisplayComponent implements OnDestroy {
  @ViewChild('target',{static:true}) target:ElementRef;

  @Input() src;
  @Input() time;

  @Output() onTimeChange: EventEmitter<any> = new EventEmitter();

  hasSrc = true;

  player: videojs.Player;
  constructor(private elementRef: ElementRef) { }

  ngOnChanges(changes){
    //(<HTMLVideoElement>(<unknown>this.target)).src=this.src;
    if(changes.src){
      this.criarVideo();
      this.setVideoSource();
      this.player.currentTime(0);
    }
    if(changes.time){
      if(this.src && this.time){
        this.player.currentTime(this.time.newTime);
        this.player.play();
        this.onTimeChange.emit();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.player) {
      this.player.dispose();
    }
  }

  criarVideo(){
    if(!this.player){
      this.player = videojs(this.target.nativeElement, null);
    }
  }

  setVideoSource(){
    if(this.src){
      this.player.src(this.src);
      this.player.show();
      this.hasSrc = true;
    }
    else{
      this.player.hide();
      this.hasSrc = false;
    }
  }
}
