import { Component, viewChild } from '@angular/core';
import { PhaserGameComponent } from './phaser-game.component';
import { MainMenu } from '../game/scenes/MainMenu';
import { CommonModule } from '@angular/common';
import { EventBus } from '../game/EventBus';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, PhaserGameComponent],
    templateUrl: './app.component.html'
})
export class AppComponent
{}
