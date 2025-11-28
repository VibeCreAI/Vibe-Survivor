/**
 * Particle System
 * Manages particle effects with object pooling for performance
 */

export class ParticleSystem {
    constructor() {
        // Active particles and explosions
        this.particles = [];
        this.explosions = [];

        // Object pools for recycling
        this.particlePool = [];
        this.explosionPool = [];

        // Pool configuration
        this.particlePoolSize = 500;
        this.explosionPoolSize = 50;

        // Quality settings (injected later)
        this.qualitySettings = null;

        // Initialize pools
        this.initializePools();
    }

    /**
     * Initializes object pools for particles and explosions
     */
    initializePools() {
        // Pre-allocate particle pool
        for (let i = 0; i < this.particlePoolSize; i++) {
            this.particlePool.push({
                x: 0, y: 0,
                vx: 0, vy: 0,
                size: 2,
                color: '#ffffff',
                life: 1,
                maxLife: 1,
                active: false,
                type: 'basic'
            });
        }

        // Pre-allocate explosion pool
        for (let i = 0; i < this.explosionPoolSize; i++) {
            this.explosionPool.push({
                x: 0, y: 0,
                radius: 0,
                maxRadius: 0,
                life: 0,
                maxLife: 0,
                color: '#FF6600',
                active: false
            });
        }
    }

    /**
     * Sets quality settings reference
     * @param {Object} qualitySettings - Quality settings object
     */
    setQualitySettings(qualitySettings) {
        this.qualitySettings = qualitySettings;
    }

    /**
     * Gets a particle from the pool or creates a new one
     * @returns {Object|null} Particle object
     */
    getPooledParticle() {
        // Try to find an inactive particle in the pool
        let particle = this.particlePool.find(p => !p.active);

        if (particle) {
            particle.active = true;
            return particle;
        }

        // Pool exhausted - create a new particle
        particle = {
            x: 0, y: 0,
            vx: 0, vy: 0,
            size: 2,
            color: '#ffffff',
            life: 1,
            maxLife: 1,
            active: true,
            type: 'basic'
        };

        this.particlePool.push(particle);
        return particle;
    }

    /**
     * Returns a particle to the pool for reuse
     * @param {Object} particle - Particle to return
     */
    returnParticleToPool(particle) {
        particle.active = false;
        particle.life = 0;
    }

    /**
     * Gets an explosion from the pool or creates a new one
     * @returns {Object|null} Explosion object
     */
    getPooledExplosion() {
        // Try to find an inactive explosion in the pool
        let explosion = this.explosionPool.find(e => !e.active);

        if (explosion) {
            explosion.active = true;
            return explosion;
        }

        // Pool exhausted - create a new explosion
        explosion = {
            x: 0, y: 0,
            radius: 0,
            maxRadius: 0,
            life: 0,
            maxLife: 0,
            color: '#FF6600',
            active: true
        };

        this.explosionPool.push(explosion);
        return explosion;
    }

    /**
     * Returns an explosion to the pool for reuse
     * @param {Object} explosion - Explosion to return
     */
    returnExplosionToPool(explosion) {
        explosion.active = false;
        explosion.life = 0;
    }

    /**
     * Creates an explosion effect with particles
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} radius - Explosion radius
     * @param {number} damage - Damage to apply to enemies
     * @param {string} sourceType - Weapon type for damage tracking
     * @param {Function} applyDamageCallback - Callback to apply damage to enemies
     * @param {Function} fastCos - Fast cosine function
     * @param {Function} fastSin - Fast sine function
     */
    createExplosion(x, y, radius, damage = 0, sourceType = null, applyDamageCallback = null, fastCos = Math.cos, fastSin = Math.sin) {
        // Create explosion visual
        const explosion = this.getPooledExplosion();
        if (!explosion) return;

        explosion.x = x;
        explosion.y = y;
        explosion.radius = 0;
        explosion.maxRadius = radius;
        explosion.life = 30;
        explosion.maxLife = 30;
        explosion.color = '#FF6600';

        this.explosions.push(explosion);

        // Create explosion particles with adaptive quality
        const baseParticleCount = 15;
        const shouldCreateExplosion = this.qualitySettings?.explosionMultiplier > 0;
        const particleCount = shouldCreateExplosion ?
            Math.floor(baseParticleCount * (this.qualitySettings?.explosionMultiplier || 1)) :
            Math.max(1, Math.floor(baseParticleCount * 0.3));

        for (let i = 0; i < particleCount; i++) {
            const particle = this.getPooledParticle();
            if (particle) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = 3 + Math.random() * 4;

                particle.x = x;
                particle.y = y;
                particle.vx = fastCos(angle) * speed;
                particle.vy = fastSin(angle) * speed;
                particle.size = 2 + Math.random() * 3;
                particle.color = ['#FF6600', '#FF9900', '#FFCC00'][Math.floor(Math.random() * 3)];
                particle.life = 0.8 + Math.random() * 0.4;
                particle.maxLife = particle.life;
                particle.type = 'explosion';

                this.particles.push(particle);
            }
        }

        // Apply damage to enemies if callback provided
        if (damage > 0 && radius > 0 && applyDamageCallback) {
            applyDamageCallback(x, y, radius, damage, sourceType);
        }
    }

    /**
     * Creates a cinematic boss defeat animation
     * @param {number} bossX - Boss X position
     * @param {number} bossY - Boss Y position
     * @param {number} bossRadius - Boss radius
     * @param {Function} createExplosionFn - Function to create explosions
     * @param {Function} createScreenShakeFn - Function to create screen shake
     * @param {Function} createRedFlashFn - Function to create red flash
     * @param {Function} createToastFn - Function to create toast notification
     * @param {Function} fastCos - Fast cosine function
     * @param {Function} fastSin - Fast sine function
     */
    createBossDefeatAnimation(bossX, bossY, bossRadius, createExplosionFn, createScreenShakeFn, createRedFlashFn, createToastFn, fastCos = Math.cos, fastSin = Math.sin) {
        // Show boss defeat notification
        if (createToastFn) {
            createToastFn("BOSS DEFEATED! DIFFICULTY INCREASED!", 'victory', 3000);
        }

        // Create massive explosion at boss location
        const mainExplosionRadius = bossRadius * 3;
        if (createExplosionFn) {
            createExplosionFn(bossX, bossY, mainExplosionRadius, 0);
        }

        // Create screen shake for dramatic effect
        if (createScreenShakeFn) {
            createScreenShakeFn(20, 30);
        }

        // Create spectacular particle burst with boss-themed colors
        const shouldCreateExplosion = this.qualitySettings?.explosionMultiplier > 0;
        const particleCount = shouldCreateExplosion ? 50 : 25;

        for (let i = 0; i < particleCount; i++) {
            const particle = this.getPooledParticle();
            if (particle) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = 4 + Math.random() * 6;

                particle.x = bossX;
                particle.y = bossY;
                particle.vx = fastCos(angle) * speed;
                particle.vy = fastSin(angle) * speed;
                particle.size = 3 + Math.random() * 5;
                particle.color = ['#FFD700', '#FF8C00', '#FFA500', '#FFFF00'][Math.floor(Math.random() * 4)];
                particle.life = 1.5 + Math.random() * 1.0;
                particle.maxLife = particle.life;
                particle.type = 'boss_defeat';

                this.particles.push(particle);
            }
        }

        // Create secondary explosions radiating outward
        const secondaryExplosions = 6;
        for (let i = 0; i < secondaryExplosions; i++) {
            setTimeout(() => {
                const angle = (Math.PI * 2 * i) / secondaryExplosions;
                const distance = bossRadius * 2;
                const explX = bossX + fastCos(angle) * distance;
                const explY = bossY + fastSin(angle) * distance;

                if (createExplosionFn) {
                    createExplosionFn(explX, explY, bossRadius * 1.5, 0);
                }

                // Add sparkle particles for each secondary explosion
                const shouldCreateParticle = this.qualitySettings?.particleMultiplier > 0;
                const sparkleCount = shouldCreateParticle ? 10 : 5;

                for (let j = 0; j < sparkleCount; j++) {
                    const particle = this.getPooledParticle();
                    if (particle) {
                        const sparkleAngle = Math.random() * Math.PI * 2;
                        const sparkleSpeed = 2 + Math.random() * 3;

                        particle.x = explX;
                        particle.y = explY;
                        particle.vx = fastCos(sparkleAngle) * sparkleSpeed;
                        particle.vy = fastSin(sparkleAngle) * sparkleSpeed;
                        particle.size = 1 + Math.random() * 2;
                        particle.color = ['#FFFFFF', '#FFFF00', '#FFD700'][Math.floor(Math.random() * 3)];
                        particle.life = 0.8 + Math.random() * 0.5;
                        particle.maxLife = particle.life;
                        particle.type = 'sparkle';

                        this.particles.push(particle);
                    }
                }
            }, i * 200);
        }

        // Create a bright flash effect
        if (createRedFlashFn) {
            createRedFlashFn(0.8);
        }
    }

    /**
     * Basic particle helpers (lightweight, pooled)
     */
    createHitParticles(x, y, color = '#FFFFFF', countScale = 1) {
        const multiplier = this.qualitySettings?.particleMultiplier ?? 1;
        if (multiplier <= 0) return;

        const count = Math.max(1, Math.floor(6 * multiplier * countScale));
        for (let i = 0; i < count; i++) {
            const particle = this.getPooledParticle();
            if (!particle) break;

            const angle = Math.random() * Math.PI * 2;
            const speed = 1.25 + Math.random() * 1.75;

            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.size = 1 + Math.random() * 2;
            particle.color = color;
            particle.life = 0.45 + Math.random() * 0.4;
            particle.maxLife = particle.life;
            particle.type = 'hit';

            this.particles.push(particle);
        }
    }

    createDashParticles() {
        // Particles removed for performance
    }

    createCriticalParticles(x, y) {
        // Particles removed for performance
    }

    createTeleportParticles(x, y) {
        // Particles removed for performance
    }

    createDeathParticles(x, y, color) {
        // Particles removed for performance
    }

    /**
     * Updates all active particles
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Update life
            particle.life -= 0.016; // Approximate 60fps decay

            // Apply drag for realistic deceleration
            particle.vx *= 0.98;
            particle.vy *= 0.98;

            // Remove dead particles and return to pool
            if (particle.life <= 0) {
                this.returnParticleToPool(particle);
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Updates all active explosions
     */
    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];

            // Expand the explosion radius over time
            const progress = 1 - (explosion.life / explosion.maxLife);
            explosion.radius = explosion.maxRadius * progress;

            explosion.life--;

            if (explosion.life <= 0) {
                this.returnExplosionToPool(explosion);
                this.explosions.splice(i, 1);
            }
        }
    }

    /**
     * Draws particles with quality-adaptive rendering
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} camera - Camera for viewport culling
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    drawParticles(ctx, camera, canvasWidth, canvasHeight) {
        if (this.particles.length === 0) return;

        ctx.save();

        // Enhanced frustum culling: Pre-filter particles aggressively
        const visibleParticles = [];
        for (const particle of this.particles) {
            if (camera.isInViewport(particle.x, particle.y, canvasWidth, canvasHeight, 50)) {
                visibleParticles.push(particle);
            }
        }

        // Early exit if no visible particles
        if (visibleParticles.length === 0) {
            ctx.restore();
            return;
        }

        const quality = this.qualitySettings?.effectQuality || 1.0;

        // Ultra-fast rendering for very low quality
        if (quality < 0.6) {
            ctx.fillStyle = '#00FFFF';
            ctx.globalAlpha = 1.0;

            for (const particle of visibleParticles) {
                ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
            }
        }
        // Batch particles by color to reduce state changes (medium quality)
        else {
            const particlesByColor = {};

            // Group particles by color (with alpha quantization for better batching)
            for (const particle of visibleParticles) {
                const alpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
                const alphaKey = Math.floor(alpha * 4) / 4; // Quantize to 0.25 increments
                const batchColor = `${particle.color}_${alphaKey}`;

                if (!particlesByColor[batchColor]) {
                    particlesByColor[batchColor] = [];
                }
                particlesByColor[batchColor].push(particle);
            }

            // Render batched particles with minimal alpha blending
            ctx.globalCompositeOperation = 'lighter';

            for (const color in particlesByColor) {
                const particles = particlesByColor[color];

                // Use alpha from first particle in batch
                const alpha = Math.max(0, Math.min(1, particles[0].life / particles[0].maxLife));

                if (quality < 0.8) {
                    // Medium quality: shared alpha for batch
                    ctx.fillStyle = particles[0].color;
                    ctx.globalAlpha = alpha;

                    // Draw all particles of this color at once
                    for (const particle of particles) {
                        const size = particle.size || 2;
                        ctx.fillRect(
                            particle.x - size / 2,
                            particle.y - size / 2,
                            size,
                            size
                        );
                    }
                } else {
                    // High quality: per-particle alpha and size
                    for (const particle of particles) {
                        const particleAlpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
                        ctx.fillStyle = particle.color;
                        ctx.globalAlpha = particleAlpha;

                        const size = particle.size || 2;
                        ctx.fillRect(
                            particle.x - size / 2,
                            particle.y - size / 2,
                            size,
                            size
                        );
                    }
                }
            }

            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    /**
     * Draws explosions with radial gradients
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} camera - Camera for viewport culling
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    drawExplosions(ctx, camera, canvasWidth, canvasHeight) {
        if (!this.explosions || this.explosions.length === 0) return;

        ctx.save();

        // Enhanced frustum culling for explosions
        const visibleExplosions = [];
        for (const explosion of this.explosions) {
            if (camera.isInViewport(explosion.x, explosion.y, canvasWidth, canvasHeight, explosion.maxRadius + 50)) {
                visibleExplosions.push(explosion);
            }
        }

        // Early exit if no visible explosions
        if (visibleExplosions.length === 0) {
            ctx.restore();
            return;
        }

        // Render visible explosions
        for (const explosion of visibleExplosions) {
            const alpha = explosion.life / explosion.maxLife;

            // Create radial gradient
            const gradient = ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.radius
            );

            gradient.addColorStop(0, `rgba(255, 200, 100, ${alpha * 0.8})`);
            gradient.addColorStop(0.5, `rgba(255, 100, 50, ${alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Resets particle system to initial state
     */
    reset() {
        this.particles = [];
        this.explosions = [];

        // Deactivate all pooled objects
        this.particlePool.forEach(p => p.active = false);
        this.explosionPool.forEach(e => e.active = false);
    }

    /**
     * Gets the number of active particles
     * @returns {number} Active particle count
     */
    getActiveParticleCount() {
        return this.particles.length;
    }

    /**
     * Gets the number of active explosions
     * @returns {number} Active explosion count
     */
    getActiveExplosionCount() {
        return this.explosions.length;
    }
}
