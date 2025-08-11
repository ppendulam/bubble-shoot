import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameOverText : Phaser.GameObjects.Text;

    constructor ()
    {
        super('GameOver');
    }

    create (data: { result: 'win' | 'lose' })
    {
        this.camera = this.cameras.main
        this.camera.setBackgroundColor('#e6d9e2ff');

        this.background = this.add.image(400, 300, 'background');
        this.background.setAlpha(0.5);

        const message = data.result === 'win' ? 'You Win!' : 'Game Over';

        this.gameOverText = this.add.text(400, 300, message, {
            fontFamily: 'Arial Black', fontSize: 64, color: '#790a5bff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
        
        const restartText = this.add.text(400, 460, 'Play Again', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        restartText.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.changeScene();
        });

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('BubbleDestroyScene');
    }
}
