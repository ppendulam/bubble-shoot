import { Component, OnInit, ElementRef, ViewChild, HostListener, AfterViewInit, OnDestroy, NgZone } from "@angular/core";
import Phaser from "phaser";
import StartGame from "../game/main";
import { EventBus } from "../game/EventBus";
import { GameOver } from "../game/scenes/GameOver";
import { Boot } from "../game/scenes/Boot";
import { Preloader } from "../game/scenes/Preloader";
import { MainMenu } from "../game/scenes/MainMenu";
import { BubbleDestroyScene } from "../game/scenes/BubbleDestroyScene";
import config from "../game/main";

@Component({
    selector: 'phaser-game',
    template: `<div id="game-container"></div>`,
    styleUrls: ['./phaser-game.component.scss'],
    standalone: true,
})
export class PhaserGameComponent implements OnInit, OnDestroy {
  private game!: Phaser.Game;

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.game = new Phaser.Game({
        ...config,
        parent: 'game-container'
      });
    });

    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize);
    if (this.game) {
      this.game.destroy(true);
    }
  }

  private handleResize = () => {
    if (this.game && this.game.scale) {
      this.game.scale.resize(window.innerWidth, window.innerHeight);
    }
  };
}
