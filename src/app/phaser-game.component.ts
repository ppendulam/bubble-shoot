import { Component, OnInit, ElementRef, ViewChild, HostListener } from "@angular/core";
import Phaser from "phaser";
import StartGame from "../game/main";
import { EventBus } from "../game/EventBus";
import { GameOver } from "../game/scenes/GameOver";
import { Boot } from "../game/scenes/Boot";
import { Preloader } from "../game/scenes/Preloader";
import { MainMenu } from "../game/scenes/MainMenu";
import { BubbleDestroyScene } from "../game/scenes/BubbleDestroyScene";

@Component({
    selector: 'phaser-game',
    template: `<div #container class="game-host"></div>`,
    styles: [
        `:host { display: block; height: 100%; width: 100%; }
        .game-host { height: 100%; width: 100%; position: relative; overflow: hidden; }
        canvas { display: block; width: 100% !important; height: 100% !important; }`
        ],
    standalone: true,
})
export class PhaserGame
{
    @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;
    scene: Phaser.Scene;
    private game: Phaser.Game;

    ngAfterViewInit()
    {
        // const gameConfig = {
        //     type: Phaser.CANVAS,
        //     parent: this.contain.nativeElement,
        //     scale: {
        //         mode: Phaser.Scale.FIT,
        //         autoCenter: Phaser.Scale.CENTER_BOTH,
        //         width: window.innerWidth,
        //         height: window.innerHeight
        //     },
        //     width: window.innerWidth,
        //     height: window.innerHeight,
        //     scene: [
        //         Boot,
        //         Preloader,
        //         MainMenu,
        //         BubbleDestroyScene,
        //         GameOver
        //     ]
        // };

            const parent = this.container.nativeElement;
            const rect = parent.getBoundingClientRect();
            // Create the Phaser game instance with the specified configuration
            const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: parent,
            width: Math.max(400, Math.floor(rect.width)),
            height: Math.max(300, Math.floor(rect.height)),
            backgroundColor: '#2c556aff',
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            scene: [
                Boot,
                Preloader,
                MainMenu,
                BubbleDestroyScene,
                GameOver
            ]
        };
        
        this.game = new Phaser.Game(config);

        // ensure the canvas fills the host in case of CSS differences
        this.resizeToParent();

            // attach listener (also handled by HostListener below for Angular lifecycle)
        window.addEventListener('resize', this.onWindowResize);

        this.game = StartGame('game-container');

        // EventBus.on('current-scene-ready', (scene: Phaser.Scene) =>
        // {
        //     this.scene = scene;

        //     if (this.sceneCallback)
        //     {
        //         this.sceneCallback(scene);
        //     }
        // });
    }
    
    @HostListener('window:orientationchange')
    onOrientationChange() {
        this.resizeToParent();
    }
    private onWindowResize = () => {
        this.resizeToParent();
    }

    private resizeToParent() {
        if (!this.game) return;
        const parent = this.container.nativeElement;
        const w = Math.max(320, Math.floor(parent.clientWidth));
        const h = Math.max(240, Math.floor(parent.clientHeight));
        this.game.scale.resize(w, h);
        // also update camera and world if needed (scene handles it)
    }


    // sceneCallback: (scene: Phaser.Scene) => void;

    // ngOnInit()
    // {
    //     this.game = StartGame('game-container');

    //     EventBus.on('current-scene-ready', (scene: Phaser.Scene) =>
    //     {
    //         this.scene = scene;

    //         if (this.sceneCallback)
    //         {
    //             this.sceneCallback(scene);
    //         }
    //     });
    // }


    ngOnDestroy() {
        window.removeEventListener('resize', this.onWindowResize);
        if (this.game) {
        try { this.game.destroy(true); } catch (e) { /* ignore */ }
        }
    }
}
