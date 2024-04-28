const showPopChunks = false;

function setChunkBorders(d3d) {
    const pos = Player.getPlayer().getPos();
    const [x, y, z] = [Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z)];

    // Calculate the player's current pop chunk position
    const chunkX = showPopChunks ? (x + 8) >> 4 : x >> 4;
    const chunkZ = showPopChunks ? (z + 8) >> 4 : z >> 4;

    // Define the corners of the chunk
    const x1 = showPopChunks ? chunkX * 16 - 8 : chunkX * 16;
    const z1 = showPopChunks ? chunkZ * 16 - 8 : chunkZ * 16;
    const x2 = x1 + 16;
    const z2 = z1 + 16;

    // Draw lines
    drawChunkBorders(d3d, x1, z1, x2, z2, y);
    return [chunkX, chunkZ];
}

// Function to draw chunk borders
function drawChunkBorders(d3d, x1, z1, x2, z2, y) {
    y = 0;
    const yTop = 320; // Extend to a very high point in the game

    // Draw vertical lines for chunk borders (violet)
    d3d.addLine(x1, y, z1, x1, yTop, z1, 0x4040ff, 255, true);
    d3d.addLine(x2, y, z1, x2, yTop, z1, 0x4040ff, 255, true);
    d3d.addLine(x1, y, z2, x1, yTop, z2, 0x4040ff, 255, true);
    d3d.addLine(x2, y, z2, x2, yTop, z2, 0x4040ff, 255, true);

    // Draw vertical red lines outside chunk
    for (let i = -16; i <= 32; i += 16) {
        const x = x1 + i;
        const z = z1 - 16;
        d3d.addLine(x, y, z, x, yTop, z, 0xff0000, 255, true);
    }

    for (let i = 0; i <= 32; i += 16) {
        const x = x1 + 32;
        const z = z1 + i;
        d3d.addLine(x, y, z, x, yTop, z, 0xff0000, 255, true);
    }

    for (let i = -16; i <= 16; i += 16) {
        const x = x1 + i;
        const z = z1 + 32;
        d3d.addLine(x, y, z, x, yTop, z, 0xff0000, 255, true);
    }

    for (let i = 0; i <= 16; i += 16) {
        const x = x1 - 16;
        const z = z1 + i;
        d3d.addLine(x, y, z, x, yTop, z, 0xff0000, 255, true);
    }

    // Draw vertical grid lines
    for (let i = 2; i <= 14; i += 2) {
        let color = 0xffff00; // Yellow
        if (i % 4 == 0) {
            color = 0x00a0a0; // Cyan
        }
        d3d.addLine(x1 + i, y, z1, x1 + i, yTop, z1, color, 255, true);
        d3d.addLine(x1, y, z1 + i, x1, yTop, z1 + i, color, 255, true);
        d3d.addLine(x2 - i, y, z2, x2 - i, yTop, z2, color, 255, true);
        d3d.addLine(x2, y, z2 - i, x2, yTop, z2 - i, color, 255, true);
    }

    // Draw horizontal grid lines at various heights
    for (let i = 0; i <= 320; i += 2) {
        let color = 0xffff00; // Yellow
        if (i % 16 == 0) {
            color = 0x4040ff; // Violet
        } else if (i % 8 == 0) {
            color = 0x00a0a0; // Cyan
        }
        d3d.addLine(x1, i, z1, x2, i, z1, color, 255, true);
        d3d.addLine(x1, i, z2, x2, i, z2, color, 255, true);
        d3d.addLine(x1, i, z1, x1, i, z2, color, 255, true);
        d3d.addLine(x2, i, z1, x2, i, z2, color, 255, true);
    }
}

JsMacros.on(
    'Key',
    true,
    JavaWrapper.methodToJava(event => {
        if (
            event.key === 'key.keyboard.j' && event.action === 1
            && KeyBind.getPressedKeys().contains('key.keyboard.f3')
        ) {
            // register/unregister code
            let d3d = GlobalVars.getObject('d3d');
            if (d3d === null) {
                // Create a new drawing context and register it
                d3d = Hud.createDraw3D();
                const [chunkX, chunkZ] = setChunkBorders(d3d);
                GlobalVars.putInt('lastChunkX', chunkX);
                GlobalVars.putInt('lastChunkZ', chunkZ);
                GlobalVars.putObject('d3d', d3d);
                d3d.register();
            } else {
                // Unregister the drawing context and clear global variables
                d3d.unregister();
                GlobalVars.remove('d3d');
                GlobalVars.remove('lastChunkX');
                GlobalVars.remove('lastChunkZ');
            }

            // Prevent the next F3 keypress from showing the debug screen
            GlobalVars.putBoolean('forbidNextF3', true);
        } else if (
            event.key === 'key.keyboard.f3' && event.action === 0
            && GlobalVars.getBoolean('forbidNextF3')
        ) {
            Chat.log("cancelling event");
            event.cancel();
            GlobalVars.putBoolean('forbidNextF3', false);
        }
    }),
);

// Event listener for game ticks
JsMacros.on(
    'Tick',
    true,
    JavaWrapper.methodToJava(() => {
        const d3d = GlobalVars.getObject('d3d');
        if (d3d !== null) {
            const pos = Player.getPlayer().getPos();
            const [x, z] = [Math.floor(pos.x), Math.floor(pos.z)];
            const chunkX = showPopChunks ? (x + 8) >> 4 : x >> 4;
            const chunkZ = showPopChunks ? (z + 8) >> 4 : z >> 4;

            const [lastChunkX, lastChunkZ] = [GlobalVars.getInt('lastChunkX'), GlobalVars.getInt('lastChunkZ')];

            if (chunkX !== lastChunkX || chunkZ !== lastChunkZ) {
                Chat.log("redrawing");
                d3d.clear();          // Clear previous borders
                setChunkBorders(d3d); // Redraw borders for the new chunk
                GlobalVars.putInt('lastChunkX', chunkX);
                GlobalVars.putInt('lastChunkZ', chunkZ);
            }
        }
    }),
);
