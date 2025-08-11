import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class BubbleDestroyScene extends Phaser.Scene
{
    private bar!: Phaser.Physics.Arcade.Sprite;
    private bubbles: Phaser.Physics.Arcade.Group;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private leftShooter!: Phaser.GameObjects.Image;
    private rightShooter!: Phaser.GameObjects.Image;
    private bullets!: Phaser.Physics.Arcade.Group;
    private lastBulletTime: number = 0;
    private bulletCooldown: number = 200; // milliseconds
    private bubbleRadius: number = 15;
    private bubblesDestroyed: number = 0
    private blackOverlay!: Phaser.GameObjects.Graphics;
    private blackOverlayAdd: number = 20;
    private blackOverlayHeight: number = 0;
    private overlayTimerEvent!: Phaser.Time.TimerEvent;
    private overlayDescendStart: number = 7000;
    private overlayDescendDelay: number = 1200;
    private inputLeft: boolean = false;
    private inputRight: boolean = false;
    private inputFire: boolean = false;
    private velocityX: number = 0;
    private scoreText!: Phaser.GameObjects.Text;

    constructor()
    {
        super('BubbleDestroyScene');
    }

    preload()
    {
        this.createBarTexture();
        this.createShooterTextures();
        this.createBlackOverlay();
    }
    private createBlackOverlay()
    {
        this.blackOverlay = this.add.graphics({ x: 0, y: 0 });
        this.blackOverlay.fillStyle(0x000000, 1);
        this.blackOverlay.fillRect(0, 0, this.scale.width, 0);
    }

    private createBarTexture()
    {
        const width = 150;
        const height = 20;
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture('bar', width, height);
        graphics.destroy();
    }

    private createShooterTextures()
    {
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

    private createBulletTexture(bulletKey: string)
    {
        const bulletSize = 30;
        const bulletGraphics = this.add.graphics();
        bulletGraphics.fillStyle(this.getRandomColor(), 1);
        bulletGraphics.beginPath();
        bulletGraphics.moveTo(0, bulletSize);
        bulletGraphics.lineTo(bulletSize / 2, 0);
        bulletGraphics.lineTo(bulletSize, bulletSize);
        bulletGraphics.closePath();
        bulletGraphics.fillPath();
        bulletGraphics.generateTexture(bulletKey, bulletSize, bulletSize);
        bulletGraphics.destroy();

    }

    private getRandomColor(): number
    {
        let color: number;
        do
        {
            color = Phaser.Math.Between(0x111111, 0xffffff);
        } while ((color & 0x0000ff) < 0x22); // Avoiding very dark blue shades
        return color;
    }

    private shootBullet(bullet: Phaser.GameObjects.GameObject | undefined, x: number, y: number)
    {
        if (bullet)
        {
            const bulletImage = bullet as Phaser.Physics.Arcade.Image;
            bulletImage.setActive(true);
            bulletImage.setVisible(true);
            (bulletImage.body as Phaser.Physics.Arcade.Body).reset(x, y);
            bulletImage.enableBody(true, x, y, true, true);
            (bulletImage.body as Phaser.Physics.Arcade.Body).allowGravity = false;
            bulletImage.setVelocityY(-300);
        }
    }

    private recycleBullets()
    {
        // Loop through all bullets and disable them if they go off-screen
        this.bullets.children.each((bullet) =>
        {
            if (bullet.active && (bullet as Phaser.Physics.Arcade.Image).y < -50)
            {
                (bullet as Phaser.Physics.Arcade.Image).disableBody(true, true);
            }
            return null;
        });
    }

    resetPreviousState(){
        this.velocityX = 0;
        this.blackOverlayHeight = 0;
        this.bubblesDestroyed = 0;
    }

    create()
    {
        //reset old values
        this.resetPreviousState();
        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#000000',
            backgroundColor: '#ffffff'
        }).setScrollFactor(0);

        const { width, height } = this.cameras.main;
        this.cameras.main.setBackgroundColor(0xf2f2f2);
        const halfHeight = height / 2;
        const bubbleDiameter = this.bubbleRadius * 2;
        const shooterSize = 20;

        // Create the bar sprite near the bottom center
        this.bar = this.physics.add.sprite(width / 2, height - 10, 'bar');
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

        for (let i = 0; i < 30; i++)
        {
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
        const isOverlapping = (x: number, y: number, bubbles: Phaser.Physics.Arcade.Group) =>
        {
            return bubbles.getChildren().some((bubble: Phaser.GameObjects.GameObject) =>
            {
                const b = bubble as Phaser.Physics.Arcade.Image;
                const dx = b.x - x;
                const dy = b.y - y;
                return Math.sqrt(dx * dx + dy * dy) < bubbleDiameter;
            });
        };

        // Function to spawn bubbles at random positions in upper half, avoiding overlap
        const spawnBubbles = (count: number) =>
        {
            for (let i = 0; i < count; i++)
            {
                let x: number, y: number, tries = 0;
                do
                {
                    const minY = this.blackOverlayHeight + this.bubbleRadius;
                    const maxY = height - 50 - this.bubbleRadius;
                    x = Phaser.Math.Between(this.bubbleRadius, width - this.bubbleRadius);
                    y = Phaser.Math.Between(minY, Math.min(maxY, minY + halfHeight - this.bubbleRadius));
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
        spawnBubbles(15);

        this.UpdateBlackOverlay();
        // Every 3 seconds, spawn 3 more bubbles
        this.time.addEvent({
            delay: 3000,
            callback: () => spawnBubbles(5),
            loop: true
        });

        // Set up collision detection
        this.physics.add.collider(this.bubbles, this.bubbles);
        this.physics.add.collider(this.bullets, this.bubbles, (bullet, bubble) =>
        {
            (bullet as Phaser.Physics.Arcade.Image).disableBody(true, true);
            (bubble as Phaser.Physics.Arcade.Image).destroy();
            this.bubblesDestroyed++;
            this.scoreText.setText(`Score: ${this.bubblesDestroyed}`);
            if (this.bubblesDestroyed >= 75) // Win condition
            {
                this.GameOver('win');
            }
        }, undefined, this);

        this.createUIButtons()

        // Enable cursor keys input
        if (this.input.keyboard)
        {
            this.cursors = this.input.keyboard.createCursorKeys();
        } else
        {
            throw new Error('Keyboard input is not available.');
        }
        this.bubblesDestroyed = 0;

        EventBus.emit('current-scene-ready', this);
    }
    private UpdateBlackOverlay()
    {
        this.blackOverlayHeight = 0;
        this.time.delayedCall(this.overlayDescendStart, () =>
        {
            this.overlayTimerEvent = this.time.addEvent({
                delay: this.overlayDescendDelay,
                callback: () =>
                {
                    this.blackOverlayHeight += this.blackOverlayAdd;

                    this.blackOverlay.clear();
                    this.blackOverlay.fillStyle(0x000000, 1);
                    this.blackOverlay.fillRect(0, 0, this.scale.width, this.blackOverlayHeight);

                    // if black overlay reaches or passes the bar's Y position
                    if (this.blackOverlayHeight >= this.bar.y - this.bar.height / 2)
                    {
                        this.GameOver('lose');
                    }
                },
                callbackScope: this,
                loop: true
            });
        });
    }
    private createUIButtons()
    {
        // BUTTON DIMENSIONS & POSITIONS
        const buttonWidth = 80;
        const buttonHeight = 80;
        const screenY = this.scale.height - buttonHeight - 30; // 10px margin from bottom
        // LEFT BUTTON
        const leftButton = this.add.circle(80, screenY, buttonWidth, 0xffc0cb, 0.4).setInteractive().setScrollFactor(0);
        // RIGHT BUTTON
        const rightButton = this.add.circle(this.scale.width - 80, screenY, buttonWidth, 0xffc0cb, 0.4).setInteractive().setScrollFactor(0);
        // FIRE BUTTON
        const fireButton = this.add.circle(this.scale.width / 2, screenY, buttonWidth, 0xffc0cb, 0.4).setInteractive().setScrollFactor(0);

        // const fireButtonSize = 80;
        // const fireButtonGraphics = this.add.graphics();

        // // Draw a triangle pointing upwards
        // fireButtonGraphics.fillStyle(0xffc0cb, 0.4);
        // fireButtonGraphics.beginPath();
        // fireButtonGraphics.moveTo(fireButtonSize / 2, 0);                     // Top
        // fireButtonGraphics.lineTo(fireButtonSize, fireButtonSize);            // Bottom-right
        // fireButtonGraphics.lineTo(0, fireButtonSize);                         // Bottom-left
        // fireButtonGraphics.closePath();
        // fireButtonGraphics.fillPath();

        // // Generate texture from graphics
        // const fireButtonKey = 'fireButtonTriangle';
        // const fireButton = fireButtonGraphics.generateTexture(fireButtonKey, fireButtonSize, fireButtonSize);
        // fireButtonGraphics.destroy();



        // State flags so you can access from `update`
        this.inputLeft = false;
        this.inputRight = false;
        this.inputFire = false;

        // LEFT events
        leftButton.on('pointerdown', () => { this.inputLeft = true; });
        leftButton.on('pointerup', () => { this.inputLeft = false; });
        leftButton.on('pointerout', () => { this.inputLeft = false; });

        // RIGHT events
        rightButton.on('pointerdown', () => { this.inputRight = true; });
        rightButton.on('pointerup', () => { this.inputRight = false; });
        rightButton.on('pointerout', () => { this.inputRight = false; });

        // FIRE events
        fireButton.on('pointerdown', () => { this.inputFire = true; });
        fireButton.on('pointerup', () => { this.inputFire = false; });
        fireButton.on('pointerout', () => { this.inputFire = false; });
    }

    override update()
    {
        // Call the recycling function first to ensure the pool is clean
        this.recycleBullets();
        // Stop any previous horizontal movement
        // this.bar.setVelocityX(0);

        let moveLeft = this.cursors.left?.isDown || this.inputLeft;
        let moveRight = this.cursors.right?.isDown || this.inputRight;
        let fire = this.cursors.space?.isDown || this.inputFire;

        if (moveLeft) {
            if(this.velocityX > 0) this.velocityX = 0;
            this.velocityX -= 10; // pressing left adds negative velocity
        }

        if (moveRight) {
            if(this.velocityX < 0) this.velocityX = 0;
            this.velocityX += 10; // pressing right adds positive velocity
        }

        // Move the bar left or right based on input
       this.bar.setVelocityX(this.velocityX);
        
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
        if (fire && now - this.lastBulletTime > this.bulletCooldown)
        {
            const leftBullet = this.bullets.get();
            this.shootBullet(leftBullet, this.leftShooter.x, this.leftShooter.y);
            const rightBullet = this.bullets.get();
            this.shootBullet(rightBullet, this.rightShooter.x, this.rightShooter.y);
            this.lastBulletTime = now;
        }

        // Destroy bubbles below the overlay line
        this.bubbles.children.each((bubble) =>
        {
            const bubbleImage = bubble as Phaser.Physics.Arcade.Image;
            if (bubbleImage.y <= this.blackOverlayHeight)
            {
                bubbleImage.destroy();
            }
            return null;
        })
        // Destroy bullets below the overlay line
        this.bullets.children.each((bullet) =>
        {
            const bulletImage = bullet as Phaser.Physics.Arcade.Image;
            if (bulletImage.active && bulletImage.y <= this.blackOverlayHeight)
            {
                bulletImage.disableBody(true, true);
            }
            return null;
        });
    }

    GameOver(gameStatus: string)
    {
        if (this.overlayTimerEvent)
        {
            this.overlayTimerEvent.remove(false);
        }
        this.scene.start('GameOver', { result: gameStatus });
    }
}
