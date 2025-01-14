// setting it up
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
ctx.imageSmoothingEnabled = false

const inventory = document.getElementById('inventory');
const inv = new Inventory(inventory, {}, 6);
inv.hide()

const interactBtn = document.getElementById('interact-btn')

const zoomFactor = 1.85

const scaledCanvas = {
    width: canvas.width / zoomFactor,
    height: canvas.height / zoomFactor
}

// determine how the game size should be like (depending on the window size)
window.addEventListener(onload, checkresize())
window.addEventListener('resize', checkresize())

function checkresize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    scaledCanvas.width = canvas.width / zoomFactor
    scaledCanvas.height = canvas.height / zoomFactor
}

let titleSequence = true
let endSequence = false

let paused = false

let locked = true
let dialoguing = false

let outsideBeaker = false
let outsideBeakerVignetteToggle = false

let camFocus = false
let camFocusTargetX
let camFocusTargetY
let yCamOffset = 70

let canInteract = false
let interactOpacity = 0
let currentInteractBlock
let climbing = false

let doingPuzzle = false

let teleporting = false
let teleportTargetX
let teleportTargetY

let blackoutOpacity = 0

let counterOverlayOpacity = 0.8

let visionRadius = 200
let overlayOpacity = 0
let vignetteOpacity = 0.9

// unlocks
let wireUnlocked = false
let fuseUnlocked = false
let flowerUnlocked = false
let wireUnlockedDeployed = false
let vineUnlocked = false
let ventUnlocked = false
let powerUnlocked = false
let fuseDone = false
let cryptexDone = false
let vaultDone = false
let otherItems = 0

// check if keys need to be released and stuff
const keys = {
    jump: {
        inAir: false,
        jumped: false,
    },
    w: {
        pressed: false,
        climbCD: false,
    },
    d: {
        pressed: false,
    },
    a: {
        pressed: false,
    },
    s: {
        pressed: false,
    },
}

// under counter overlay
const counterOverlay = {
    position: {
        x: 0,
        y: 1344,
    },
    width: 1904,
    height: 576,
}

// camera
const camera = {
    position: {
        x: -1350 + (scaledCanvas.width/2),
        y: -1030 + (scaledCanvas.height/2), // 2560 is the height of the background image (change later)
    },
}

// the player
const player = new Player({
    position: {
        x: 1510,
        y: 1091,
    },
    gravity: 1, // change gravity as see fit

    collisionBlocks: collisionBlocks,
    interactables: interactables,

    imageSrc: './assets/images/anims/idle.png',
    frameRate: 4,

    type: 'player',

    // all different animations
    animations: {
        Idle: {
            imageSrc: './assets/images/anims/idle.png',
            frameRate: 4,
            frameBuffer: 20,
        },
        Walk: {
            imageSrc: './assets/images/anims/walk.png',
            frameRate: 4,
            frameBuffer: 10,
        },
        Climb: {
            imageSrc: './assets/images/anims/climb.png',
            frameRate: 2,
            frameBuffer: 10,
        },
        Jump_Idle: {
            imageSrc: './assets/images/anims/jump-idle.png',
            frameRate: 1,
            frameBuffer: 1,
        },
        Jump_Walk: {
            imageSrc: './assets/images/anims/jump-walk.png',
            frameRate: 1,
            frameBuffer: 1,
        },
        Fall_Idle: {
            imageSrc: './assets/images/anims/fall-idle.png',
            frameRate: 1,
            frameBuffer: 1,
        },
        Fall_Walk: {
            imageSrc: './assets/images/anims/fall-walk.png',
            frameRate: 1,
            frameBuffer: 1,
        },
        Push: {
            imageSrc: './assets/images/anims/push.png',
            frameRate: 2,
            frameBuffer: 20,
        },
    },

})

// items
const item = {
    wire: new Item({url: './assets/images/items/wire.png'}, 'wire', 'desc', inv, 1),
    fuse: new Item({url: './assets/images/items/fuse.png'}, 'fuse', 'desc', inv, 1),
    crystal: new Item({url: './assets/images/items/crystal.png'}, 'crystal', 'desc', inv, 1),
    flower: new Item({url: './assets/images/items/flower.png'}, 'flower', 'desc', inv, 1),
    gem: new Item({url: './assets/images/items/gem.png'}, 'wire', 'gem', inv, 1),
    growth: new Item({url: './assets/images/items/growth-potion.png'}, 'growth', 'desc', inv, 1),
    rock: new Item({url: './assets/images/items/rock.png'}, 'rock', 'desc', inv, 1),
}

// vent puzzle
const ventParent = document.getElementById('vent')

const vent = new Vent(ventParent, () => {
    vent.ventCanvas.style.visibility = 'hidden'
    ventUnlocked = true
    locked = false
    doingPuzzle = false
    interactBtn.textContent = '[E] to interact'
});

const cryptexParent = document.getElementById('cryptex');
const goodAnswer = [1, 9, 8, 4];
const cryptex = new Cryptex(cryptexParent, 5, goodAnswer, () => {
    setTimeout(() => {
        cryptex.destroy();
        locked = false
        doingPuzzle = false
        cryptexDone = true
        interactBtn.textContent = '[E] to interact'

        // add items
        if (vaultDone) {
            inv.addItem(item.crystal)
            inv.addItem(item.rock)
            inv.addItem(item.growth)

            pickup.play()
            inv.show()
            setTimeout(() => {
                inv.hide()
            }, 1500);
        }
    }, 500);
});

const vaultDoorParent = document.getElementById('vault-door')
const vault = new SpinnyVault(vaultDoorParent, 100, 100, './features/public/images/theWehl.png', 3, ()=>{
    setTimeout(() => {
        vault.destroy()
        vaultDoorParent.style.visibility = 'hidden'
        vaultDone = true
        locked = false
        doingPuzzle = false
        interactBtn.textContent = '[E] to interact'

        // add items
        if (cryptexDone) {
            inv.addItem(item.crystal)
            inv.addItem(item.rock)
            inv.addItem(item.growth)

            pickup.play()
            inv.show()
            setTimeout(() => {
                inv.hide()
            }, 1500);
        }
    }, 500)
});
vault.parent.style.zIndex = '100'

const telescopeParent = document.getElementById('telescope')
const grid = new HexGrid(100, 50, 50, true, telescopeParent, window.innerWidth, window.innerHeight, {bgColor: '#181825', dotColor: '#fff', lineColor: '#fff', lineWidth: 5, lineCap: 'round', dotRadius: 3, goodDotColor: '#00ff00', badDotColor: '#ff0000'}, () => {
    setTimeout(() => {
        telescopeParent.style.zIndex = '0'
        telescopeParent.style.visibility = 'hidden'
        document.getElementById('grid-txt').style.visibility = 'hidden'
        telescopeParent.style.pointerEvents = 'none'
        locked = false
        doingPuzzle = false
        grid.disableMouse()
        
        inv.addItem(item.gem)
        otherItems++

        pickup.play()
        inv.show()
        setTimeout(() => {
            inv.hide()
        }, 1500);
    }, 500);
}, "dedwd", false);

telescopeParent.style.position = 'absolute'
telescopeParent.style.visibility = 'hidden'
telescopeParent.style.pointerEvents = 'none'
grid.disableMouse();

const boilerParent = document.getElementById('boiler')
const crafting = new Crafting(inv, [item.rock.name, item.crystal.name, item.gem.name, item.flower.name], ()=>{
    for (const item of inv.slotElements) {
        console.log(item)
        if (item.dragElement) {
            item.dragElement.style.visibility = 'hidden'
        }
    }
    inv.hide()
    setTimeout(() => {
        interactBtn.style.opacity = 0

        setTimeout(() => {
            final.startFromOrigin()
        }, 3000);

        document.getElementById('fade-to-black').style.visibility = 'visible'
    }, 1000)
}, 4, 100, 100, boilerParent)

const electrical = new ElectricalPuzzle(document.getElementById('electrical'), 500, 500, {
    wireWidth: 10,
    wireHeight: 40,
    bgColor: 'black'
}, ()=>{
    setTimeout(() => {
        electrical.parentDiv.style.visibility = 'hidden'
        powerUnlocked = true
        locked = false
        doingPuzzle = false
        interactBtn.textContent = '[E] to interact'
    }, 500)
});
electrical.parentDiv.style.visibility = 'hidden'

const fuseBoxPuzzle = new FuseBox(document.getElementById('fusebox'), 500, 500, 100, 100, item.fuse, ()=>{
    for (const item of inv.slotElements) {
        console.log(item)
        if (item.dragElement) {
            item.dragElement.style.visibility = 'hidden'
        }
    }
    inv.hide()
    setTimeout(() => {
        fuseBoxPuzzle.parentDiv.style.visibility = 'hidden'
        fuseBoxPuzzle.destroy()
        fuseDone = true
        electrical.parentDiv.style.visibility = 'visible'
    }, 500)
});
fuseBoxPuzzle.parentDiv.style.visibility = 'hidden'

// const craftingPUzzle = new CraftingPuzzle(document.getElementById('crafting'), 500, 500, 100, 100, item.growth, item.rock, item.crystal, item.gem, ()=>{

const image = new Image()
image.src = box.imageSrc

// wait for all elemetns to laod
let loaded = false
window.addEventListener('load', () => {
    loaded = true

    // change title screen
    document.getElementById('start-overlay').innerHTML = 'Press any key to start'
})
function loadingAnim() {
    setTimeout(() => {
        if (!loaded) document.getElementById('start-overlay').textContent = 'loading.'
        setTimeout(() => {
            if (!loaded) document.getElementById('start-overlay').textContent = 'loading..'
            setTimeout(() => {
                if (!loaded) document.getElementById('start-overlay').textContent = 'loading...'
                loadingAnim()
            }, 500);
        }, 500);
    }, 500);
}
loadingAnim()

// screen changing
window.addEventListener('keydown', () => {
    fadeLoadingScreen()
})
window.addEventListener('click', () => {
    fadeLoadingScreen()
})
let stopMenutheme = false
function fadeLoadingScreen() {
    if (loaded && titleSequence && !stopMenutheme) {
        document.getElementById('start-overlay').style.animation = 'fadeOut 1s linear forwards'

        setTimeout(() => {
            // bg music
            menuTheme.play()
            menuTheme.loop = true

            document.getElementById('start-overlay').style.visibility = 'hidden'
        }, 1000)
    }
}

// hover effect
document.getElementById('start-button').onmouseover = () => {
    document.getElementById('start-button').textContent = '> START'
}
document.getElementById('start-button').onmouseout = () => {
    document.getElementById('start-button').textContent = 'START'
}
document.getElementById('credit-button').onmouseover = () => {
    document.getElementById('credit-button').textContent = '> CREDITS'
}
document.getElementById('credit-button').onmouseout = () => {
    document.getElementById('credit-button').textContent = 'CREDITS'
}
document.getElementById('close-credit-button').onmouseover = () => {
    document.getElementById('close-credit-button').textContent = '< BACK'
}
document.getElementById('close-credit-button').onmouseout = () => {
    document.getElementById('close-credit-button').textContent = 'BACK'
}

const menu = document.getElementById('menu')
const credits = document.getElementById('credits')
document.getElementById('credit-button').onclick = () => {
    menuButton.play()

    // slide in the credits, slide out the menu
    menu.style.animation = 'slideOut 1s ease-out forwards'
    setTimeout(() => {
        credits.style.animation = 'slideIn 1s ease-out forwards'
    }, 400);
}
document.getElementById('close-credit-button').onclick = () => {
    menuButton.play()

    // slide in the credits, slide out the menu
    credits.style.animation = 'slideOut 1s ease-out forwards'
    setTimeout(() => {
        menu.style.animation = 'slideIn 1s ease-out forwards'
    }, 400);
}

document.getElementById('start-button').onclick = () => {
    menuButton.play()
    stopMenutheme = true

    // lower volume
    function lowerVolume() {
        if (menuTheme.volume <= 0.05) {
            // volume already 0
            menuTheme.pause()
        }
        else {
            menuTheme.volume -= 0.05
            setTimeout(lowerVolume, 50)
        }
    }
    lowerVolume()

    menu.style.animation = 'slideOut 1s ease-out forwards'
    
    player.velocity.x = 0
    player.velocity.y = 0

    camFocus = true
    camFocusTargetX = player.position.x + player.width/2 - scaledCanvas.width/2
    camFocusTargetY = player.position.y + player.height/2 - scaledCanvas.height/2 - yCamOffset

    setTimeout(() => {
        dialogueStart.startFromOrigin()
    }, 3000);

}

document.getElementById('controls-btn').onclick = () => {
    locked = false
    titleSequence = false
    camFocus = false

    document.getElementById('controls').style.animation = 'slideOut 1s ease-out forwards'
}

// make the game work
function animate() {
    window.requestAnimationFrame(animate)
    // redraw canvas
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // slower background to add depth
    ctx.save()
    ctx.scale(zoomFactor, zoomFactor)
    ctx.translate(camera.position.x * 0.8, camera.position.y)
    background.update()

    showHoverBack()

    ctx.restore()

    // zoom
    ctx.save()
    ctx.scale(zoomFactor, zoomFactor)
    ctx.translate(camera.position.x, camera.position.y)

    foreground.update()
    
    if (!wireUnlocked) wireItem.update()
    if (wireUnlockedDeployed) wireDeployed.update()
    if (vineUnlocked) grownPlant.update()
    if (ventUnlocked) ventOpen.update()
    if (!fuseUnlocked) fuseItem.update()
    if (!flowerUnlocked) flowerItem.update()

    drawBox()
    
    drawCounterOverlay()

    showHover()
    
    if (!paused && !locked) {
        // drawObjects()

        if (outsideBeaker) beakerOverlay.update()

        player.update()

        if (!outsideBeaker) beakerOverlay.update()

        playerMovement()

        interactTxtAnim()
    }
    else if (locked) {
        lockPlayer()
    }
    else {
        beakerOverlay.update()
        player.draw()
    }
    if (camFocus) {
        animateCam()
    }

    drawVignette()

    ctx.restore()
}

animate()

// for debugging
function drawObjects() {
    collisionBlocks.forEach(block => {
        block.draw()
    })
    interactables.forEach(block => {
        block.draw()
    })
}

function playerMovement() {
    // player movement
    player.velocity.x = 0
    if (keys.d.pressed && keys.a.pressed) player.velocity.x = 0
    else if (keys.d.pressed) {
        player.velocity.x = 4 * player.speedMultiplier
    }
    else if (keys.a.pressed) {
        player.velocity.x = -4 * player.speedMultiplier
    }
    if (keys.jump.inAir) {
        if (!keys.jump.jumped && !keys.w.climbCD) {
            player.velocity.y = -15
            keys.jump.jumped = true
        }
        keys.jump.inAir = false
    }
}

function interactTxtAnim() {
    // interact text 
    if (canInteract && document.getElementById('interact-btn').style.opacity <= 1) 
        interactOpacity += 0.05
    else if (!canInteract && document.getElementById('interact-btn').style.opacity >= 0) 
        interactOpacity -= 0.05
    document.getElementById('interact-btn').style.opacity = interactOpacity
}

function animateCam() {
    const smoothness = 0.02
    camera.position.x -= (camFocusTargetX + camera.position.x) * smoothness
    camera.position.y -= (camFocusTargetY + camera.position.y) * smoothness
}

function lockPlayer() {
    player.draw()

    if (titleSequence) {
        player.updateAnims()
        Sprite.prototype.update.call(player)
        beakerOverlay.update()
    }

    else if (doingPuzzle) {
        player.velocity.x = 0
        player.updateAnims()
        Sprite.prototype.update.call(player)

        player.velocity.y += player.gravity
        player.applyYVelocity()
        player.checkVerticalCollisions()
        
        player.updateCamBox()
    }

    else if (dialoguing) {
        player.velocity.x = 0
        player.updateAnims()
        Sprite.prototype.update.call(player)

        player.velocity.y += player.gravity
        player.applyYVelocity()
        player.checkVerticalCollisions()

        beakerOverlay.update()
        player.updateCamBox()
        if (document.getElementById('interact-btn').style.opacity >= 0) 
            interactOpacity -= 0.05
        document.getElementById('interact-btn').style.opacity = interactOpacity
    }

    else if (!paused) {
        player.updateCamBox()
        player.applyYVelocity()
        player.updateAnims()
        player.checkBelow()
        player.checkUnderCounter()
        beakerOverlay.update()
        
        canInteract = false

        if (player.velocity.y !== 0) Sprite.prototype.update.call(player)

        // fade the interact btn
        if (document.getElementById('interact-btn').style.opacity >= 0) 
            interactOpacity -= 0.05
        document.getElementById('interact-btn').style.opacity = interactOpacity
        
        // climbing
        if (climbing) {
            player.velocity.y = 0
            if (keys.w.pressed) {
                climbingFootsteps.play()

                if ((player.position.y > groundMiddle.position.y - player.height && currentInteractBlock === ladderWire) || (player.position.y > vineTop.position.y - player.height && currentInteractBlock === ladderVine) || (player.position.y > counterShelf.position.y - player.height && currentInteractBlock === pipeLadder))
                    player.velocity.y = -3
                else { // top of the ladder
                    keys.w.climbCD = true
                    locked = false
                    climbing = false

                    // update player
                    player.velocity.x = 0

                    setTimeout(() => {
                        keys.w.climbCD = false
                    }, 700);
                }
            }
            else if (keys.s.pressed) {
                climbingFootsteps.play()

                if ((player.position.y + player.height + 3 < groundBottom.position.y && currentInteractBlock === ladderWire) || (player.position.y + player.height + 3 < groundMiddle.position.y && currentInteractBlock === ladderVine) || (player.position.y + player.height + 3 < groundBottom.position.y && currentInteractBlock === pipeLadder))
                    player.velocity.y = 3
                else { // bottom of the ladder
                    keys.w.climbCD = true
                    locked = false
                    climbing = false

                    // update player
                    player.velocity.x = 0

                    setTimeout(() => {
                        keys.w.climbCD = false
                    }, 700);
                }
            }
        }

        // teleporting
        if (teleporting) {
            player.updateCamBox()
            player.updateAnims()
            Sprite.prototype.update.call(player)

            player.velocity.x = 0
            player.velocity.y = 0

            canInteract = false

            if (blackoutOpacity <= 1 && player.position.x !== teleportTargetX) blackoutOpacity += 0.02
            else {
                player.position.x = teleportTargetX
                player.position.y = teleportTargetY
                player.flip = true

                if (currentInteractBlock === ventDoor) {
                    yCamOffset = 165
                    visionRadius = 900
                    vignetteOpacity = 0.3
                    overlayOpacity = 0
                }
                if (currentInteractBlock === ventDoorTop) {
                    yCamOffset = 150
                    visionRadius = 350
                    vignetteOpacity = 0.9
                    overlayOpacity = 0.5
                }

                setTimeout(() => {
                    if (blackoutOpacity > 0) blackoutOpacity -= 0.03
                    else {
                        locked = false 
                        teleporting = false
                    }
                }, 500)
            }
            document.getElementById('blackout-screen').style.opacity = blackoutOpacity
        }
    }
}

// dialogue
function startDialogue() {
    if (!dialogueBeakerOnce) {
        dialogueBeaker.startFromOrigin()
        dialogueBeakerOnce = true
    }
}

function interact() {
    if (currentInteractBlock.type === 'ladder') {
        if ((currentInteractBlock === ladderVine && vineUnlocked) || (currentInteractBlock === pipeLadder) || (currentInteractBlock === ladderWire)) {
            player.position.x = (currentInteractBlock.position.x + currentInteractBlock.size.width/2) - player.width/2
            locked = true
            climbing = true
        }
        if (currentInteractBlock === ladderVine && !vineUnlocked) {
            interaction.play()

            if (vaultDone && cryptexDone) {
                vineUnlocked = true
                inv.removeItem(item.growth)
            }
        }
        else if (currentInteractBlock === ladderVine && vineUnlocked) {
            climbing = true
            locked = true
            player.position.x = (currentInteractBlock.position.x + currentInteractBlock.size.width/2) - player.width/2
        }
    }
    else if (currentInteractBlock.type === 'door') {
        locked = true
        teleporting = true
        if (currentInteractBlock === ventDoor) {
            if (!ventUnlocked) {
                interaction.play()
                teleporting = false
                doingPuzzle = true

                interactBtn.textContent = '[E] to close'

                vent.ventCanvas.style.visibility = 'visible'
            }
            else {
                panel.play()
                teleportTargetX = 2458
                teleportTargetY = 499
            }
        }
        if (currentInteractBlock === ventDoorTop) {
            panel.play()
            teleportTargetX = 1750
            teleportTargetY = 1835
        }
    }
    else if (currentInteractBlock.type === 'puzzle') {
        locked = true
        doingPuzzle = true
        interactBtn.textContent = '[E] to close'

        if (currentInteractBlock === deployWire) {
            locked = false
            doingPuzzle = false
            interaction.play()
            wireUnlockedDeployed = true
            inv.removeItem(item.wire)
            interactBtn.textContent = '[E] to interact'
        }
        if (currentInteractBlock === fuseBox) {
            panel.play()

            if (!fuseDone) {
                fuseBoxPuzzle.parentDiv.style.visibility = 'visible'
                inv.show()
            }
            else {
                electrical.parentDiv.style.visibility = 'visible'
            }
        }
        if (currentInteractBlock === vaultDoor) {
            interaction.play()

            document.getElementById('vault-door').style.visibility = 'visible'
        }
        if (currentInteractBlock === vaultKeypad) {
            interaction.play()

            document.getElementById('cryptex').style.visibility = 'visible'
        }
        if (currentInteractBlock === booksBelow) {
            paper.play()

            document.getElementById('book').style.visibility = 'visible'
        }
        if (currentInteractBlock === noteBottom) {
            paper.play()
            console.log('note bottom')

            document.getElementById('note').style.visibility = 'visible'
            document.getElementById('note-txt-1').textContent = 'The electrical box was acting up recently. I think it\'s the fuses. I\'ll leave the spare in the shelves.'
            document.getElementById('note-txt-2').textContent = 'The vault is connected to it, though, so you won\'t be able to open it when it\'s missing a fuse'
            document.getElementById('note-txt-3').textContent = '- Josh'
        }
        if (currentInteractBlock === noteTop) {
            paper.play()

            document.getElementById('note').style.visibility = 'visible'
        document.getElementById('note-txt-1').textContent = 'Looks like the telescope is fixed again!'
            document.getElementById('note-txt-2').textContent = 'Maybe the sky will yield an answer to my search for an universal antidote?'
            document.getElementById('note-txt-3').textContent = '- Maria'
        }
        if (currentInteractBlock === noteMiddle) {
            paper.play()

            document.getElementById('note').style.visibility = 'visible'
            document.getElementById('note-txt-1').textContent = 'I moved the growth potion because it seems as though its fumes can lead to uncontrolled growth. Potential safety hazard?'
            document.getElementById('note-txt-2').textContent = 'PS: Is the code still Josh\'s birth year? If so, please change ASAP'
            document.getElementById('note-txt-3').textContent = '- Marcus'
        }
        if (currentInteractBlock === binderTop) {
            paper.play()
            
            document.getElementById('binder').style.visibility = 'visible'
        }
        if (currentInteractBlock === telescope) {
            interaction.play()

            telescopeParent.style.visibility = 'visible'
            document.getElementById('grid-txt').style.visibility = 'visible'
            telescopeParent.style.pointerEvents = 'auto'
            telescopeParent.style.zIndex = '120'
            grid.enableMouse()
        }
        if (currentInteractBlock === boiler) {
            interaction.play()

            inv.show()
            interactBtn.style.opacity = 0
            endSequence = true
            boilerParent.style.visibility = 'visible'
        }
    }
    else if (currentInteractBlock.type === 'item') {
        pickup.play()
        inv.show()
        setTimeout(() => {
            inv.hide()
        }, 1500);

        if (currentInteractBlock === wirePickup) {
            wireUnlocked = true
            inv.addItem(item.wire)
        }
        if (currentInteractBlock === fusePickup) {
            fuseUnlocked = true
            inv.addItem(item.fuse)
        }
        if (currentInteractBlock === flowerPickup) {
            flowerUnlocked = true
            inv.addItem(item.flower)
            otherItems++
        }
    }
}
function closePuzzle() {
    interactBtn.textContent = '[E] to interact'
    locked = false
    doingPuzzle = false

    vent.ventCanvas.style.visibility = 'hidden'
    document.getElementById('note').style.visibility = 'hidden'
    document.getElementById('binder').style.visibility = 'hidden'
    document.getElementById('book').style.visibility = 'hidden'
    document.getElementById('cryptex').style.visibility = 'hidden'
    fuseBoxPuzzle.parentDiv.style.visibility = 'hidden'
    electrical.parentDiv.style.visibility = 'hidden'
    document.getElementById('vault-door').style.visibility = 'hidden'
    boilerParent.style.visibility = 'hidden'
    telescopeParent.style.visibility = 'hidden'
    document.getElementById('grid-txt').style.visibility = 'hidden'
    telescopeParent.style.pointerEvents = 'none'
    telescopeParent.style.zIndex = '0'
    grid.disableMouse()
    inv.hide()

    const elements = document.querySelectorAll('.dragElements')
    elements.forEach((e) => {
        e.style.visibility = 'hidden'
    })
}

// draw hover effect
function showHover() {
    if (!canInteract) return
    if ((currentInteractBlock === fuseBox || currentInteractBlock === vaultDoor || currentInteractBlock === binderTop)) 
        hoverLayer1.update()
    if ((currentInteractBlock === vaultKeypad || currentInteractBlock === booksBelow || currentInteractBlock === boiler || currentInteractBlock === fusePickup)) 
        hoverLayer2.update()
    if (((currentInteractBlock === ladderVine && !vineUnlocked) || currentInteractBlock === wirePickup || currentInteractBlock === ventDoor || currentInteractBlock === ventDoorTop || currentInteractBlock === noteBottom || currentInteractBlock === telescope)) 
        hoverLayer3.update()
    if (currentInteractBlock === deployWire || currentInteractBlock === flowerPickup)
        hoverLayer4.update()

    // change text

}
function showHoverBack() {
    if (canInteract && (currentInteractBlock === noteMiddle || currentInteractBlock === noteTop)) 
        hoverLayerBack.update()
}

// vignette
function drawVignette() {
    const gradient = ctx.createRadialGradient(
        player.position.x + player.width / 2, player.position.y + player.height / 2, player.width / 2, 
        player.position.x + player.width / 2, player.position.y + player.height / 2, visionRadius
    )

    gradient.addColorStop(0, `rgba(0, 0, 0, ${overlayOpacity})`)
    gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteOpacity})`)

    // Fill the canvas with the gradient
    ctx.fillStyle = gradient

    const targetX = Math.abs(camera.position.x)
    const targetY = Math.abs(camera.position.y)
    ctx.fillRect(targetX - 200, targetY - 200, scaledCanvas.width + 400, scaledCanvas.height + 400)
}

// draw counter overlay
function drawCounterOverlay() {
    ctx.fillStyle = `rgba(0, 0, 0, ${counterOverlayOpacity})`
    ctx.fillRect(counterOverlay.position.x, counterOverlay.position.y, counterOverlay.width, counterOverlay.height)
}

// draw pushable box
function drawBox() {
    if (!image) return
    ctx.drawImage(image, box.position.x, box.position.y, box.width, box.height)
}
