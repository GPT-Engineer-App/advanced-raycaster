import React, { useEffect, useRef, useState } from 'react';
import { Howl, Howler } from 'howler';
import backgroundMusic from '../assets/sounds/background-music.mp3';
import shootSound from '../assets/sounds/shoot.mp3';
import moveSound from '../assets/sounds/move.mp3';
import enemyHitSound from '../assets/sounds/enemy-hit.mp3';
import enemyDefeatedSound from '../assets/sounds/enemy-defeated.mp3';
import ambientSound from '../assets/sounds/ambient.mp3';

const Index = () => {
  const canvasRef = useRef(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levels, setLevels] = useState([
    [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ],
    [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ],
  ]);

  const [enemies, setEnemies] = useState([
    { type: 'stationary', x: 100, y: 100, health: 100, speed: 0 },
    { type: 'patrolling', x: 200, y: 200, health: 100, speed: 1, direction: 1 },
    { type: 'chasing', x: 300, y: 300, health: 100, speed: 2 },
  ]);

  const [weapons, setWeapons] = useState([
    { type: 'pistol', ammo: 10, damage: 10 },
    { type: 'shotgun', ammo: 5, damage: 25 },
  ]);

  const [currentWeapon, setCurrentWeapon] = useState(0);

  const [powerUps, setPowerUps] = useState([
    { type: 'health', x: 150, y: 150, value: 25 },
    { type: 'speed', x: 250, y: 250, value: 1.5, duration: 5000 },
    { type: 'damage', x: 350, y: 350, value: 2, duration: 5000 },
  ]);

  const [score, setScore] = useState(0);

  const backgroundMusicHowl = new Howl({ src: [backgroundMusic], loop: true, volume: 0.5 });
  const shootSoundHowl = new Howl({ src: [shootSound], volume: 0.5 });
  const moveSoundHowl = new Howl({ src: [moveSound], volume: 0.5 });
  const enemyHitSoundHowl = new Howl({ src: [enemyHitSound], volume: 0.5 });
  const enemyDefeatedSoundHowl = new Howl({ src: [enemyDefeatedSound], volume: 0.5 });
  const ambientSoundHowl = new Howl({ src: [ambientSound], loop: true, volume: 0.5 });

  useEffect(() => {
    backgroundMusicHowl.play();
    ambientSoundHowl.play();
    return () => {
      backgroundMusicHowl.stop();
      ambientSoundHowl.stop();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not found");
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      console.error("Failed to get canvas context");
      return;
    }

    // Canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    const [playerPosition, setPlayerPosition] = useState({ x: width / 2, y: height / 2 });

    // Player properties
    const player = {
      x: playerPosition.x,
      y: playerPosition.y,
      angle: 0,
      speed: 2,
      rotationSpeed: 0.05,
      health: 100,
      activePowerUps: [],
    };

    // Map properties
    const map = levels[currentLevel];
    const mapWidth = map[0].length;
    const mapHeight = map.length;
    const tileSize = 64;

    // Raycasting function
    const castRays = () => {
      const numRays = 100;
      const fov = Math.PI / 3;
      const halfFov = fov / 2;
      const angleStep = fov / numRays;

      for (let i = 0; i < numRays; i++) {
        const rayAngle = player.angle - halfFov + i * angleStep;
        const ray = castSingleRay(rayAngle);
        drawRay(ray, rayAngle, i);
      }
    };

    // Cast a single ray
    const castSingleRay = (angle) => {
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);

      for (let i = 0; i < 20; i++) {
        const x = player.x + i * tileSize * cos;
        const y = player.y + i * tileSize * sin;

        const mapX = Math.floor(x / tileSize);
        const mapY = Math.floor(y / tileSize);

        if (map[mapY] && map[mapY][mapX] === 1) {
          return { x, y };
        }
      }

      return { x: player.x, y: player.y };
    };

    // Draw a ray
    const drawRay = (ray, angle, i) => {
      context.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      context.beginPath();
      context.moveTo(player.x, player.y);
      context.lineTo(ray.x, ray.y);
      context.stroke();
    };

    // Handle keyboard input
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
          moveSoundHowl.play();
          movePlayer(event.key === 'ArrowUp' ? player.speed : -player.speed);
          break;
        case 'ArrowLeft':
          player.angle -= player.rotationSpeed;
          break;
        case 'ArrowRight':
          player.angle += player.rotationSpeed;
          break;
        case ' ':
          shootSoundHowl.play();
          shoot();
          break;
        case '1':
          setCurrentWeapon(0);
          break;
        case '2':
          setCurrentWeapon(1);
          break;
        default:
          break;
      }
      console.log(`Player position: (${player.x}, ${player.y}), angle: ${player.angle}`);
    };

    const movePlayer = (speed) => {
      const newX = player.x + speed * Math.cos(player.angle);
      const newY = player.y + speed * Math.sin(player.angle);

      const mapX = Math.floor(newX / tileSize);
      const mapY = Math.floor(newY / tileSize);

      if (map[mapY] && map[mapY][mapX] === 0) {
        player.x = newX;
        player.y = newY;
        setPlayerPosition({ x: newX, y: newY });
      }

      // Check for power-up collisions
      powerUps.forEach((powerUp, index) => {
        const dx = player.x - powerUp.x;
        const dy = player.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < tileSize / 2) {
          applyPowerUp(powerUp);
          setPowerUps((prevPowerUps) => prevPowerUps.filter((_, i) => i !== index));
        }
      });
    };

    const shoot = () => {
      const weapon = weapons[currentWeapon];
      if (weapon.ammo > 0) {
        weapon.ammo -= 1;
        const ray = castSingleRay(player.angle);
        enemies.forEach((enemy) => {
          const dx = enemy.x - ray.x;
          const dy = enemy.y - ray.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < tileSize) {
            enemy.health -= weapon.damage;
            enemyHitSoundHowl.play();
            if (enemy.health <= 0) {
              enemyDefeatedSoundHowl.play();
              // Remove enemy from the game
              setEnemies((prevEnemies) => prevEnemies.filter((e) => e !== enemy));
              setScore((prevScore) => prevScore + 100); // Increase score when enemy is defeated
            }
          }
        });
      }
    };

    const applyPowerUp = (powerUp) => {
      switch (powerUp.type) {
        case 'health':
          player.health = Math.min(player.health + powerUp.value, 100);
          break;
        case 'speed':
          player.speed *= powerUp.value;
          player.activePowerUps.push({ type: 'speed', value: powerUp.value, duration: powerUp.duration });
          setTimeout(() => {
            player.speed /= powerUp.value;
            player.activePowerUps = player.activePowerUps.filter((pu) => pu.type !== 'speed');
          }, powerUp.duration);
          break;
        case 'damage':
          weapons.forEach((weapon) => {
            weapon.damage *= powerUp.value;
          });
          player.activePowerUps.push({ type: 'damage', value: powerUp.value, duration: powerUp.duration });
          setTimeout(() => {
            weapons.forEach((weapon) => {
              weapon.damage /= powerUp.value;
            });
            player.activePowerUps = player.activePowerUps.filter((pu) => pu.type !== 'damage');
          }, powerUp.duration);
          break;
        default:
          break;
      }
    };

    // Enemy AI logic
    const updateEnemies = () => {
      setEnemies((prevEnemies) =>
        prevEnemies.map((enemy) => {
          switch (enemy.type) {
            case 'stationary':
              // Stationary enemies do not move
              break;
            case 'patrolling':
              // Patrolling enemies move back and forth
              if (enemy.direction === 1) {
                enemy.x += enemy.speed;
                if (enemy.x > width - tileSize) {
                  enemy.direction = -1;
                }
              } else {
                enemy.x -= enemy.speed;
                if (enemy.x < tileSize) {
                  enemy.direction = 1;
                }
              }
              break;
            case 'chasing':
              // Chasing enemies move towards the player
              const dx = player.x - enemy.x;
              const dy = player.y - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
              }
              break;
            default:
              break;
          }
          return enemy;
        })
      );
    };

    // Render enemies
    const renderEnemies = () => {
      enemies.forEach((enemy) => {
        context.fillStyle = 'green';
        context.beginPath();
        context.arc(enemy.x, enemy.y, 10, 0, 2 * Math.PI);
        context.fill();
      });
    };

    // Render power-ups
    const renderPowerUps = () => {
      powerUps.forEach((powerUp) => {
        context.fillStyle = powerUp.type === 'health' ? 'red' : powerUp.type === 'speed' ? 'blue' : 'yellow';
        context.beginPath();
        context.arc(powerUp.x, powerUp.y, 10, 0, 2 * Math.PI);
        context.fill();
      });
    };

    // Render HUD
    const renderHUD = () => {
      context.fillStyle = 'white';
      context.font = '20px Arial';
      context.fillText(`Health: ${player.health}`, 10, 20);
      context.fillText(`Ammo: ${weapons[currentWeapon].ammo}`, 10, 40);
      context.fillText(`Score: ${score}`, 10, 60);
    };

    // Render minimap
    const renderMinimap = () => {
      const minimapScale = 0.2;
      const minimapWidth = mapWidth * tileSize * minimapScale;
      const minimapHeight = mapHeight * tileSize * minimapScale;

      context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      context.fillRect(width - minimapWidth - 10, 10, minimapWidth, minimapHeight);

      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          if (map[y][x] === 1) {
            context.fillStyle = 'white';
            context.fillRect(
              width - minimapWidth - 10 + x * tileSize * minimapScale,
              10 + y * tileSize * minimapScale,
              tileSize * minimapScale,
              tileSize * minimapScale
            );
          }
        }
      }

      context.fillStyle = 'red';
      context.beginPath();
      context.arc(
        width - minimapWidth - 10 + player.x * minimapScale,
        10 + player.y * minimapScale,
        5,
        0,
        2 * Math.PI
      );
      context.fill();

      // Draw exit tile
      context.fillStyle = 'blue';
      context.fillRect(
        width - minimapWidth - 10 + (mapWidth - 2) * tileSize * minimapScale,
        10 + (mapHeight - 2) * tileSize * minimapScale,
        tileSize * minimapScale,
        tileSize * minimapScale
      );
    };

    const checkLevelCompletion = () => {
      const exitTile = { x: mapWidth - 2, y: mapHeight - 2 }; // Example exit tile position
      const playerTile = { x: Math.floor(player.x / tileSize), y: Math.floor(player.y / tileSize) };

      if (playerTile.x === exitTile.x && playerTile.y === exitTile.y) {
        changeLevel();
      }
    };

    // Add event listener for keyboard input
    window.addEventListener('keydown', handleKeyDown);

    // Game loop
    const gameLoop = () => {
      context.clearRect(0, 0, width, height);
      castRays();
      updateEnemies();
      renderEnemies();
      renderPowerUps();
      renderHUD();
      renderMinimap();
      checkLevelCompletion();
      console.log("Rendering frame");
      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentLevel, levels, enemies, weapons, currentWeapon, powerUps, score, playerPosition]);

  const changeLevel = () => {
    setCurrentLevel((prevLevel) => (prevLevel + 1) % levels.length);
    setPlayerPosition({ x: width / 2, y: height / 2 });
    player.x = width / 2;
    player.y = height / 2;
    player.angle = 0;
    player.health = 100;
    setEnemies([
      { type: 'stationary', x: 100, y: 100, health: 100, speed: 0 },
      { type: 'patrolling', x: 200, y: 200, health: 100, speed: 1, direction: 1 },
      { type: 'chasing', x: 300, y: 300, health: 100, speed: 2 },
    ]);
    setPowerUps([
      { type: 'health', x: 150, y: 150, value: 25 },
      { type: 'speed', x: 250, y: 250, value: 1.5, duration: 5000 },
      { type: 'damage', x: 350, y: 350, value: 2, duration: 5000 },
    ]);
  };

  return (
    <div>
      <canvas ref={canvasRef} width="800" height="600" />
      <button onClick={changeLevel}>Change Level</button>
      <div>
        <p>Current Weapon: {weapons[currentWeapon].type}</p>
        <p>Ammo: {weapons[currentWeapon].ammo}</p>
      </div>
    </div>
  );
};

export default Index;