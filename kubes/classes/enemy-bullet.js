import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js'

class EnemyBullet extends THREE.Mesh {
    constructor({color = '#ff0000', velocity = {x:0, y:0, z:0}, position, target}) {
        super (
            new THREE.OctahedronGeometry(0.07, 0), 
            new THREE.MeshStandardMaterial({color})
        )

        this.position.set(position.x, position.y, position.z)
        this.velocity = velocity

        this.target = target

        this.direction = new THREE.Vector3()
            .subVectors(this.target.position, this.position)
            .normalize()
            .multiplyScalar(0.1)

        // bullet trail
        this.trailLength = 10
        this.trailPositions = new Float32Array(this.trailLength * 3)
        this.trailGeometry = new THREE.BufferGeometry()
        this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3))

        const textureLoader = new THREE.TextureLoader()
        const trailTexture = textureLoader.load('./public/textures/gradient-texture.png')

        this.trailMaterial = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            map: trailTexture,
        })

        this.trail = new THREE.Line(this.trailGeometry, this.trailMaterial)

        this.trailIndex = 0

        // this.type = 1 // 1 is player bullet, 2 is enemy bullet

        this.wait = true

        this.initializeTrail()
    }

    initializeTrail() {
        // set initial position of the trail to bullet
        for (let i = 0; i < this.trailLength; i++) {
            this.trailPositions[i * 3] = this.position.x
            this.trailPositions[i * 3 + 1] = this.position.y
            this.trailPositions[i * 3 + 2] = this.position.z
        }

        this.trail = new THREE.Line(this.trailGeometry, this.trailMaterial)

        this.trailGeometry.attributes.position.needsUpdate = true
    }

    update(scene) {
        this.velocity = this.direction

        this.position.add(this.velocity)

        this.updateTrail()

        // del bullet when reaching target
        if (
            this.target &&
            this.position.x > this.target.position.x - this.target.width / 2 &&
            this.position.x < this.target.position.x + this.target.width / 2 &&
            this.position.z > this.target.position.z - this.target.depth / 2 &&
            this.position.z < this.target.position.z + this.target.depth / 2
        ) {
            if (!this.wait) {
                this.wait = true
                scene.remove(this)
                scene.remove(this.trail)
            }
            else {
                this.wait = false
            }
        }

        // del bullet if it's too far
        if (this.position.length() > 30) {
            scene.remove(this)
            scene.remove(this.trail)
        }
    }

    updateTrail() {
        for (let i = this.trailLength - 1; i > 0; i--) {
            this.trailPositions[i * 3] = this.trailPositions[(i - 1) * 3]
            this.trailPositions[i * 3 + 1] = this.trailPositions[(i - 1) * 3 + 1]
            this.trailPositions[i * 3 + 2] = this.trailPositions[(i - 1) * 3 + 2]
        }

        // update position
        this.trailPositions[0] = this.position.x
        this.trailPositions[1] = this.position.y
        this.trailPositions[2] = this.position.z

        // console.log(this.position.x, this.position.y, this.position.z)

        this.trailGeometry.attributes.position.needsUpdate = true
    }
}

export default EnemyBullet