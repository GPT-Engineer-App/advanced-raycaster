import React, { useEffect, useRef } from 'react';

const Index = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Player properties
    const player = {
      x: width / 2,
      y: height / 2,
      angle: 0,
      speed: 2,
    };

    // Map properties
    const map = [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ];
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

    // Game loop
    const gameLoop = () => {
      context.clearRect(0, 0, width, height);
      castRays();
      requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} width="800" height="600" />
    </div>
  );
};

export default Index;