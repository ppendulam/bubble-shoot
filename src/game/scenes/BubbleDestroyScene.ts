import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class BubbleDestroyScene extends Phaser.Scene {
    private bar!: Phaser.Physics.Arcade.Sprite;
    private bubbles: Phaser.Physics.Arcade.Group;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private leftShooter!: Phaser.GameObjects.Image;
    private rightShooter!: Phaser.GameObjects.Image;
    private bullets!: Phaser.Physics.Arcade.Group;
    private lastBulletTime: number = 0;
    private bulletCooldown: number = 200; // milliseconds
    private bubbleRadius: number = 15;

    constructor() {
        super('BubbleDestroyScene');
    }

    preload() {
        this.createBarTexture();
        this.createShooterTextures();
    }

    private createBarTexture() {
        const width = 150;
        const height = 20;
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture('bar', width, height);
        graphics.destroy();
    }

    private createShooterTextures() {
        const shooterSize = 20;
        const graphics = this.add.graphics();
        
        // Create left shooter texture
        graphics.fillStyle(0x808080, 1);
        graphics.beginPath();
        graphics.moveTo(0, shooterSize);
        graphics.lineTo(shooterSize / 2, 0);
        graphics.lineTo(shooterSize, shooterSize);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('leftShooter', shooterSize, shooterSize);
        
        // Create right shooter texture
        graphics.clear();
        graphics.fillStyle(0x808080, 1);
        graphics.beginPath();
        graphics.moveTo(0, shooterSize);
        graphics.lineTo(shooterSize / 2, 0);
        graphics.lineTo(shooterSize, shooterSize);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('rightShooter', shooterSize, shooterSize);
        
        graphics.destroy();
    }

    private createBulletTexture(bulletKey: string) {
        const bulletGraphics = this.add.graphics();
        bulletGraphics.fillStyle(0xffff00, 1);
        bulletGraphics.fillCircle(4, 4, 4);
        bulletGraphics.generateTexture(bulletKey, 8, 8);
        bulletGraphics.destroy();
    }

    private getRandomColor(): number {
        let color: number;
        do {
            color = Phaser.Math.Between(0x111111, 0xffffff);
        } while ((color & 0x0000ff) < 0x22); // Avoiding very dark blue shades
        return color;
    }

    private shootBullet(bullet: Phaser.GameObjects.GameObject | undefined, x: number, y: number) {
        if (bullet) {
            const bulletImage = bullet as Phaser.Physics.Arcade.Image;
            bulletImage.setActive(true);
            bulletImage.setVisible(true);
            (bulletImage.body as Phaser.Physics.Arcade.Body).reset(x, y);
            bulletImage.enableBody(true, x, y, true, true);
            (bulletImage.body as Phaser.Physics.Arcade.Body).allowGravity = false;
            bulletImage.setVelocityY(-300);
        }
    }

    private recycleBullets() {
        // Loop through all bullets and disable them if they go off-screen
        this.bullets.children.each((bullet) => {
            if (bullet.active && (bullet as Phaser.Physics.Arcade.Image).y < -50) {
                (bullet as Phaser.Physics.Arcade.Image).disableBody(true, true);
            }
            return null;
        });
    }

    create() {
        const { width, height } = this.cameras.main;
        const upperHalfHeight = height / 2;
        const bubbleDiameter = this.bubbleRadius * 2;
        const shooterSize = 20;

        // Create the bar sprite near the bottom center
        this.bar = this.physics.add.sprite(width / 2, height - 30, 'bar');
        this.bar.setImmovable(true);
        this.bar.setCollideWorldBounds(true);
        (this.bar.body as Phaser.Physics.Arcade.Body).allowGravity = false;
        
        this.leftShooter = this.add.image(
            this.bar.x - this.bar.width / 2 + shooterSize / 2, 
            this.bar.y - shooterSize, 
            'leftShooter'
        ).setOrigin(0.5, 0.5);

        this.rightShooter = this.add.image(
            this.bar.x + this.bar.width / 2 - shooterSize / 2, 
            this.bar.y - shooterSize, 
            'rightShooter'
        ).setOrigin(0.5, 0.5);

         // Create group for bullets, with pooling
        this.bullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            defaultKey: 'bullet',
            maxSize: 30, // Limit the number of bullets on screen
            runChildUpdate: true
        });

        for (let i = 0; i < 30; i++) {
            const bulletKey = `bullet_${i}`;
            // Create unique texture for each bullet           
            this.createBulletTexture(bulletKey);
            // Add bullet to group with unique key
            const bullet = this.physics.add.image(0, 0, bulletKey);
            bullet.setActive(false);
            bullet.setVisible(false);
            this.bullets.add(bullet);
        }
        
        // Create group for bubbles
        this.bubbles = this.physics.add.group();
        
        // Helper to check overlap with existing bubbles
        const isOverlapping = (x: number, y: number, bubbles: Phaser.Physics.Arcade.Group) => {
            return bubbles.getChildren().some((bubble: Phaser.GameObjects.GameObject) => {
                const b = bubble as Phaser.Physics.Arcade.Image;
                const dx = b.x - x;
                const dy = b.y - y;
                return Math.sqrt(dx * dx + dy * dy) < bubbleDiameter;
            });
        };

        // Function to spawn bubbles at random positions in upper half, avoiding overlap
        const spawnBubbles = (count: number) => {
            for (let i = 0; i < count; i++) {
                let x: number, y: number, tries = 0;
                do {
                    x = Phaser.Math.Between(this.bubbleRadius, width - this.bubbleRadius);
                    y = Phaser.Math.Between(this.bubbleRadius, upperHalfHeight - this.bubbleRadius);
                    tries++;
                } while (isOverlapping(x, y, this.bubbles) && tries < 100);

                const color = this.getRandomColor();
                const bubbleGraphics = this.add.graphics();
                bubbleGraphics.fillStyle(color, 1);
                bubbleGraphics.fillCircle(this.bubbleRadius, this.bubbleRadius, this.bubbleRadius);
                const textureKey = `bubble_${color}_${Date.now()}_${Math.random()}`;
                bubbleGraphics.generateTexture(textureKey, bubbleDiameter, bubbleDiameter);
                bubbleGraphics.destroy();

                const bubble = this.physics.add.image(x, y, textureKey);
                bubble.setCircle(this.bubbleRadius);
                bubble.setCollideWorldBounds(true);
                bubble.setBounce(1);
                bubble.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
                this.bubbles.add(bubble);
            }
        };
        // Spawn initial 10 bubbles
        spawnBubbles(10);

         // Every 3 seconds, spawn 3 more bubbles
        this.time.addEvent({
            delay: 3000,
            callback: () => spawnBubbles(3),
            loop: true
        });

        // Set up collision detection
        this.physics.add.collider(this.bubbles, this.bubbles);
         this.physics.add.collider(this.bullets, this.bubbles, (bullet, bubble) => {
            (bullet as Phaser.Physics.Arcade.Image).disableBody(true, true);
            (bubble as Phaser.Physics.Arcade.Image).destroy();
        }, undefined, this);

        // Enable cursor keys input
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        } else {
            throw new Error('Keyboard input is not available.');
        }
        EventBus.emit('current-scene-ready', this);
    }

    override update() {
        // Call the recycling function first to ensure the pool is clean
        this.recycleBullets();
        // Stop any previous horizontal movement
        // this.bar.setVelocityX(0);

        if (this.cursors.left?.isDown) {
            this.bar.setVelocityX(-300);
        } else if (this.cursors.right?.isDown) {
            this.bar.setVelocityX(300);
        }
        // else if (this.cursors.up?.isDown){
        //     this.bar.setVelocityY(-300);
        // } else if (this.cursors.down?.isDown) {
        //     this.bar.setVelocityY(300);
        // }

        // Keep shooters attached to bar ends
        this.leftShooter.x = this.bar.x - this.bar.width / 2 + this.leftShooter.width / 2;
        this.leftShooter.y = this.bar.y - this.leftShooter.width;

        this.rightShooter.x = this.bar.x + this.bar.width / 2 - this.leftShooter.width / 2;
        this.rightShooter.y = this.bar.y - this.leftShooter.width;

        const now = this.time.now;
        if (this.cursors.space?.isDown && now - this.lastBulletTime > this.bulletCooldown) {
            const leftBullet = this.bullets.get();
            this.shootBullet(leftBullet, this.leftShooter.x, this.leftShooter.y);
            const rightBullet = this.bullets.get();
            this.shootBullet(rightBullet, this.rightShooter.x, this.rightShooter.y);
            this.lastBulletTime = now;
        }
    }

    GameOver(){
        this.scene.start('GameOver');
    }
    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
