// Analiza los píxeles del logo subido y devuelve su color dominante como hex.
// Se usa para sugerir automáticamente una paleta de color basada en el logo,
// en vez de dejar siempre el color por defecto de la plantilla elegida.
// Ignora fondos casi blancos/negros y píxeles transparentes para no promediar
// el "aire" alrededor del isotipo y quedarse solo con el color de la marca.
export function extractDominantColor(imgUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const size = 40;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0, g = 0, b = 0, count = 0;
        let rAll = 0, gAll = 0, bAll = 0, countAll = 0;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 200) continue;
          const rr = data[i];
          const gg = data[i + 1];
          const bb = data[i + 2];
          rAll += rr;
          gAll += gg;
          bAll += bb;
          countAll++;
          const isNearWhite = rr > 235 && gg > 235 && bb > 235;
          const isNearBlack = rr < 20 && gg < 20 && bb < 20;
          if (isNearWhite || isNearBlack) continue;
          r += rr;
          g += gg;
          b += bb;
          count++;
        }

        if (count === 0) {
          if (countAll === 0) {
            resolve(null);
            return;
          }
          r = rAll;
          g = gAll;
          b = bAll;
          count = countAll;
        }

        const toHex = (n) => Math.round(n / count).toString(16).padStart(2, '0');
        resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
      } catch {
        // Falla silenciosa (ej: canvas "tainted"): simplemente no sugerimos paleta.
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imgUrl;
  });
}

const hexToRgb = (hex) => {
  const clean = hex.replace('#', '');
  return { r: parseInt(clean.slice(0, 2), 16), g: parseInt(clean.slice(2, 4), 16), b: parseInt(clean.slice(4, 6), 16) };
};

const colorDistance = (hexA, hexB) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
};

// Igual que extractDominantColor, pero en vez de un solo promedio devuelve
// varios colores representativos del logo — para sugerirlos como paleta en
// los editores de color de las secciones, no solo como acento único de tema.
// Agrupa píxeles parecidos (redondeando cada canal) y promedia cada grupo
// para un color fiel; después descarta grupos demasiado parecidos entre sí
// para que la paleta final no repita casi el mismo tono varias veces.
export function extractPalette(imgUrl, count = 6) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const size = 60;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const buckets = new Map();
        const step = 24;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 200) continue;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const isNearWhite = r > 240 && g > 240 && b > 240;
          const isNearBlack = r < 15 && g < 15 && b < 15;
          if (isNearWhite || isNearBlack) continue;
          const key = `${Math.round(r / step)}-${Math.round(g / step)}-${Math.round(b / step)}`;
          const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
          bucket.r += r;
          bucket.g += g;
          bucket.b += b;
          bucket.n += 1;
          buckets.set(key, bucket);
        }

        const toHex = (n) => Math.round(n).toString(16).padStart(2, '0');
        const sorted = [...buckets.values()].sort((a, b) => b.n - a.n);

        const colors = [];
        for (const bucket of sorted) {
          const hex = `#${toHex(bucket.r / bucket.n)}${toHex(bucket.g / bucket.n)}${toHex(bucket.b / bucket.n)}`;
          const tooClose = colors.some((c) => colorDistance(c, hex) < 40);
          if (!tooClose) colors.push(hex);
          if (colors.length >= count) break;
        }

        resolve(colors);
      } catch {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = imgUrl;
  });
}
