import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { BubbleDestroyScene } from './scenes/BubbleDestroyScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container', // will be overwritten by StartGame parent argument
  backgroundColor: '#2c556aff',
  scale: {
    mode: Phaser.Scale.RESIZE,          // important for responsive resizing
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
  physics: { default: 'arcade', arcade: { debug: false }},
  scene: [ Boot, Preloader, MainMenu, BubbleDestroyScene, GameOver ]
};

// const StartGame = (parent: string) => {
//   return new Game({ ...config, parent });
// }

export default config;